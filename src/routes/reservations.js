/**
 * ===============================================================
 * RESERVATIONS ROUTES (BACKEND)
 * ===============================================================
 * Express routes quản lý đặt chỗ với auto-expiry service
 * 
 * Endpoints:
 * - POST /api/reservations - Tạo reservation mới (15 phút validity)
 * - GET /api/reservations/active - Lấy active reservation của user
 * - GET /api/reservations/user/:userId - Lấy lịch sử reservations
 * - DELETE /api/reservations/:id - Hủy reservation
 * - POST /api/reservations/:id/checkin - Check-in reservation
 * 
 * Reservation flow:
 * 1. POST /reservations → reservationService.createReservation()
 *    - Kiểm tra user chưa có reservation active
 *    - Kiểm tra charging point available
 *    - Tạo booking record với expire_time = now + 15 phút
 *    - Scheduler tự động expire sau 15 phút
 * 
 * 2. GET /reservations/active?userId=X
 *    - Lấy reservation đang active (chưa expire, chưa check-in)
 *    - Return reservation với remainingSeconds
 * 
 * 3. DELETE /reservations/:id?userId=X
 *    - Hủy reservation
 *    - Cập nhật status = Cancelled
 *    - Release charging point
 * 
 * 4. POST /reservations/:id/checkin
 *    - User check-in tại trạm
 *    - Cập nhật status = Active
 *    - Cho phép bắt đầu charging session
 * 
 * Auto-expiry:
 * - chargingScheduler chạy mỗi 30s
 * - Tìm reservations có expire_time < now
 * - Cập nhật status = Expired
 * - Release charging points
 * 
 * Schema (bookings table used for reservations):
 * - booking_id: BIGINT (primary key)
 * - user_id: BIGINT (foreign key → users)
 * - point_id: BIGINT (foreign key → charging_points)
 * - start_time: TIMESTAMP (thời gian đặt)
 * - expire_time: TIMESTAMP (hết hạn sau 15 phút)
 * - status: VARCHAR (Confirmed, Active, Expired, Cancelled)
 * 
 * Dependencies:
 * - reservationService: Logic tạo/hủy/expire reservations
 * - chargingScheduler: Auto-expire old reservations
 * - Supabase: Database operations
 */

import express from 'express';
import reservationService from '../services/reservationService.js';
import supabase from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/reservations
 * Create a new reservation (NEW: Uses reservation service with auto-expiry)
 */
router.post('/', async (req, res) => {
  try {
    const { userId, pointId, durationMinutes } = req.body;

    if (!userId || !pointId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, pointId'
      });
    }

    const result = await reservationService.createReservation({
      userId,
      pointId,
      durationMinutes: durationMinutes || 15
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reservations/active
 * Get user's active reservation (NEW)
 */
router.get('/active', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId parameter'
      });
    }

    console.log('🔍 Getting active reservation for user:', userId);

    const result = await reservationService.getActiveReservation(parseInt(userId));

    console.log('📊 Active reservation result:', result);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching active reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/reservations/user/:userId - Get user's reservations (UPDATED)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('reservations')
      .select(`
        *,
        charging_points (
          point_id,
          point_name,
          connector_type,
          power_kw,
          stations (
            station_id,
            name,
            address,
            price_per_kwh
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reservations, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: reservations,
      total: reservations.length
    });
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservations',
      message: error.message
    });
  }
});

// GET /api/reservations/:id - Get reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(`
        *,
        stations (
          id,
          name,
          address,
          city,
          power_kw,
          connector,
          price_per_kwh,
          lat,
          lng,
          phone,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservation',
      message: error.message
    });
  }
});

// PUT /api/reservations/:id/status - Update reservation status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes = '' } = req.body;

    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Get current reservation to check charging_point_id
    const { data: currentReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('charging_point_id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    // Add completion timestamp for completed status
    if (status === 'completed') {
      updateData.actual_end_time = new Date().toISOString();
    }

    // Add start timestamp for active status
    if (status === 'active') {
      updateData.actual_start_time = new Date().toISOString();
    }

    const { data: reservation, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        stations (
          id,
          name,
          address,
          city
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // Update charging point status based on reservation status
    if (currentReservation.charging_point_id) {
      let newPointStatus = null;

      if (status === 'completed' || status === 'cancelled') {
        newPointStatus = 'Available';
      } else if (status === 'active') {
        newPointStatus = 'In Use';
      }

      if (newPointStatus) {
        const { error: updatePointError } = await supabase
          .from('charging_points')
          .update({
            status: newPointStatus,
            updated_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
          })
          .eq('point_id', currentReservation.charging_point_id);

        if (updatePointError) {
          console.error('Failed to update charging point status:', updatePointError);
        } else {
          console.log(`✅ Charging point ${currentReservation.charging_point_id} status updated to ${newPointStatus}`);
        }
      }
    }

    res.json({
      success: true,
      data: reservation,
      message: `Reservation ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reservation status',
      message: error.message
    });
  }
});

/**
 * DELETE /api/reservations/:id
 * Cancel a reservation (UPDATED: Uses reservation service)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId in query parameter'
      });
    }

    console.log('🔍 Cancelling reservation:', id, 'for user:', userId);

    const result = await reservationService.cancelReservation(parseInt(id), parseInt(userId));

    console.log('📊 Cancel result:', result);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/reservations/station/:stationId - Get reservations for a station
router.get('/station/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { date, status } = req.query;

    let query = supabase
      .from('reservations')
      .select(`
        *,
        charging_points (
          point_id,
          point_name,
          connector_type,
          stations (
            station_id,
            name
          )
        )
      `)
      .eq('charging_points.station_id', stationId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reservations, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: reservations,
      total: reservations.length
    });
  } catch (error) {
    console.error('Error fetching station reservations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch station reservations',
      message: error.message
    });
  }
});

/**
 * POST /api/reservations/:id/validate
 * Validate a reservation before starting session (NEW)
 */
router.post('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId in request body'
      });
    }

    const result = await reservationService.validateReservation(parseInt(id), parseInt(userId));

    res.json(result);
  } catch (error) {
    console.error('Error validating reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reservations/available-points
 * Get all available charging points (status = Available) (NEW)
 */
router.get('/available-points', async (req, res) => {
  try {
    const { stationId } = req.query;

    let query = supabase
      .from('charging_points')
      .select(`
        *,
        stations (
          station_id,
          name,
          address,
          price_per_kwh
        )
      `)
      .eq('status', 'Available');

    if (stationId) {
      query = query.eq('station_id', parseInt(stationId));
    }

    const { data, error } = await query.order('point_name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching available points:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reservations/point/:pointId/status
 * Get real-time status of a specific charging point (NEW)
 */
router.get('/point/:pointId/status', async (req, res) => {
  try {
    const { pointId } = req.params;

    const { data, error } = await supabase
      .from('charging_points')
      .select(`
        point_id,
        point_name,
        status,
        connector_type,
        power_kw,
        stations (
          station_id,
          name,
          price_per_kwh
        )
      `)
      .eq('point_id', parseInt(pointId))
      .single();

    if (error) {
      throw error;
    }

    // Check if there's an active reservation
    const { data: activeReservation } = await supabase
      .from('reservations')
      .select('reservation_id, user_id, expire_time')
      .eq('point_id', parseInt(pointId))
      .in('status', ['Confirmed', 'Active'])
      .maybeSingle();

    res.json({
      success: true,
      data: {
        ...data,
        active_reservation: activeReservation || null
      }
    });
  } catch (error) {
    console.error('Error fetching point status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;