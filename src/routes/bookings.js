/**
 * ===============================================================
 * BOOKINGS ROUTES (BACKEND)
 * ===============================================================
 * Express routes xử lý đặt chỗ sạc (bookings)
 * 
 * Endpoints:
 * - GET /api/bookings - Lấy bookings của user hoặc tất cả
 * - POST /api/bookings - Tạo booking mới
 * - GET /api/bookings/:id - Lấy chi tiết 1 booking
 * - PUT /api/bookings/:id/status - Cập nhật trạng thái booking
 * - DELETE /api/bookings/:id - Hủy booking
 * 
 * Query params (GET /):
 * - userId: Filter theo user_id
 * - status: Filter theo status (Pending, Confirmed, Canceled, Completed)
 * - limit: Số bookings trả về (mặc định 50)
 * - offset: Pagination offset (mặc định 0)
 * 
 * Booking flow:
 * 1. User tạo booking → status = Pending
 * 2. System confirm (hoặc auto-confirm) → status = Confirmed
 * 3. User check-in → Start charging session
 * 4. Session kết thúc → status = Completed
 * 5. User cancel hoặc hết hạn → status = Canceled
 * 
 * Validation:
 * - Kiểm tra charging point có available không
 * - Kiểm tra thời gian booking có trùng lặp không
 * - Kiểm tra user tồn tại
 * 
 * Response joins:
 * - users: user_id, name, email
 * - charging_points: point_id, name, status, power_kw, station info
 * - stations: id, name, address, city, lat, lng
 * 
 * Dependencies:
 * - Supabase: Database operations
 * - Middleware: requireAuth (xác thực user)
 */

import express from 'express';
import supabase from '../supabase/client.js';

const router = express.Router();

// GET /api/bookings - Get all bookings for a user
router.get('/', async (req, res) => {
  try {
    const { userId, status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        users (
          user_id,
          name,
          email
        ),
        charging_points (
          point_id,
          name,
          status,
          power_kw,
          station_id,
          stations (
            id,
            name,
            address,
            city,
            lat,
            lng
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: bookings, error } = await query;

    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      data: bookings,
      total: bookings.length
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

// POST /api/bookings - Create new booking
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      point_id,
      start_time,
      expire_time,
      promo_id,
      price_estimate
    } = req.body;

    // Validate required fields
    if (!user_id || !point_id || !start_time || !expire_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, point_id, start_time, expire_time'
      });
    }

    // Check if charging point exists and is available
    const { data: chargingPoint, error: pointError } = await supabase
      .from('charging_points')
      .select(`
        *,
        stations (
          id,
          name,
          address
        )
      `)
      .eq('point_id', point_id)
      .single();

    if (pointError) {
      return res.status(404).json({
        success: false,
        error: 'Charging point not found'
      });
    }

    if (chargingPoint.status !== 'Available') {
      return res.status(400).json({
        success: false,
        error: `Charging point is not available. Current status: ${chargingPoint.status}`
      });
    }

    // Check for time conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('*')
      .eq('point_id', point_id)
      .in('status', ['Pending', 'Confirmed'])
      .or(
        `and(start_time.lte.${start_time},expire_time.gt.${start_time}),` +
        `and(start_time.lt.${expire_time},expire_time.gte.${expire_time}),` +
        `and(start_time.gte.${start_time},expire_time.lte.${expire_time})`
      );

    if (conflictError) {
      throw conflictError;
    }

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Time slot is already booked',
        conflicts
      });
    }

    // Create booking
    const bookingData = {
      user_id,
      point_id,
      start_time,
      expire_time,
      promo_id: promo_id || null,
      price_estimate: price_estimate || 0,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select(`
        *,
        charging_points (
          *,
          stations (
            id,
            name,
            address,
            city
          )
        )
      `)
      .single();

    if (createError) {
      throw createError;
    }

    // ✅ Update charging point status to Reserved
    const { error: updatePointError } = await supabase
      .from('charging_points')
      .update({
        status: 'Reserved',
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .eq('point_id', point_id);

    if (updatePointError) {
      console.error('Failed to update charging point status:', updatePointError);
      // Don't fail the booking, just log the error
    } else {
      console.log(`✅ Charging point ${point_id} status updated to Reserved`);
    }
    
    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Canceled', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Get current booking to check point_id
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('point_id, status')
      .eq('booking_id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add timestamps based on status
    if (status === 'Confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === 'Canceled') {
      updateData.canceled_at = new Date().toISOString();
    }

    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('booking_id', id)
      .select(`
        *,
        charging_points (
          *,
          stations (
            id,
            name
          )
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // ✅ Update charging point status based on booking status
    let newPointStatus = null;

    if (status === 'Confirmed') {
      newPointStatus = 'In Use';  // User arrived and started charging
    } else if (status === 'Canceled' || status === 'Completed') {
      newPointStatus = 'Available';  // Release the point
    }

    if (newPointStatus && currentBooking.point_id) {
      const { error: updatePointError } = await supabase
        .from('charging_points')
        .update({
          status: newPointStatus,
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('point_id', currentBooking.point_id);

      if (updatePointError) {
        console.error('Failed to update charging point status:', updatePointError);
      } else {
        console.log(`✅ Charging point ${currentBooking.point_id} status updated to ${newPointStatus}`);
      }
    }
    
    res.json({
      success: true,
      data: booking,
      message: `Booking ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
      message: error.message
    });
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get booking details before deletion
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('point_id, status')
      .eq('booking_id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }
      throw fetchError;
    }

    // Check if booking can be cancelled
    if (['Completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed bookings'
      });
    }

    // Update status to Canceled instead of deleting
    const { data: canceledBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'Canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // ✅ Release charging point
    if (booking.point_id) {
      const { error: releaseError } = await supabase
        .from('charging_points')
        .update({
          status: 'Available',
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('point_id', booking.point_id);

      if (releaseError) {
        console.error('Failed to release charging point:', releaseError);
      } else {
        console.log(`✅ Charging point ${booking.point_id} released and set to Available`);
      }
    }
    
    res.json({
      success: true,
      data: canceledBooking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
});

export default router;