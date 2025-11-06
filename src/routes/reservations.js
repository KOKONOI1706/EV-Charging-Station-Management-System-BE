import express from 'express';
import supabase from '../supabase/client.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Require authenticated user for reservation actions
router.use(authenticateToken);
router.use(requireAuth);

// POST /api/reservations - Create a new reservation
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      station_id,
      charging_point_id,
      start_time,
      end_time,
      total_cost,
      payment_method = 'card',
      notes = ''
    } = req.body;

    // Validate required fields
    if (!user_id || !station_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, station_id, start_time, end_time'
      });
    }

    // Check if specific charging point is requested and available
    if (charging_point_id) {
      const { data: chargingPoint, error: pointError } = await supabase
        .from('charging_points')
        .select('status, station_id')
        .eq('point_id', charging_point_id)
        .single();

      if (pointError) {
        return res.status(404).json({
          success: false,
          error: 'Charging point not found'
        });
      }

      if (chargingPoint.station_id !== station_id) {
        return res.status(400).json({
          success: false,
          error: 'Charging point does not belong to this station'
        });
      }

      if (chargingPoint.status !== 'Available') {
        return res.status(400).json({
          success: false,
          error: `Charging point is not available. Current status: ${chargingPoint.status}`
        });
      }
    }

    // Check if station exists and has availability
    const { data: station, error: stationError } = await supabase
      .from('stations')
      .select('available_spots, total_spots, status')
      .eq('id', station_id)
      .single();

    if (stationError) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }

    if (station.status !== 'active' || station.available_spots <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Station is not available for reservation'
      });
    }

    // Check for time conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from('reservations')
      .select('*')
      .eq('station_id', station_id)
      .in('status', ['confirmed', 'active', 'pending'])
      .or(
        `and(start_time.lte.${start_time},end_time.gt.${start_time}),` +
        `and(start_time.lt.${end_time},end_time.gte.${end_time}),` +
        `and(start_time.gte.${start_time},end_time.lte.${end_time})`
      );

    if (conflictError) {
      throw conflictError;
    }

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Time slot is already reserved',
        conflicts
      });
    }

    // Create reservation
    const reservationData = {
      user_id,
      station_id,
      charging_point_id: charging_point_id || null,
      start_time,
      end_time,
      total_cost: parseFloat(total_cost) || 0,
      payment_method,
      notes,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: reservation, error: createError } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select(`
        *,
        stations (
          id,
          name,
          address,
          city,
          power_kw,
          connector,
          price_per_kwh
        )
      `)
      .single();

    if (createError) {
      throw createError;
    }

    // Update charging point status to Reserved if specific point was selected
    if (charging_point_id) {
      const { error: updatePointError } = await supabase
        .from('charging_points')
        .update({
          status: 'Reserved',
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('point_id', charging_point_id);

      if (updatePointError) {
        console.error('Failed to update charging point status:', updatePointError);
        // Don't fail the reservation, just log the error
      } else {
        console.log(`✅ Charging point ${charging_point_id} status updated to Reserved`);
      }
    }

    res.status(201).json({
      success: true,
      data: reservation,
      message: 'Reservation created successfully'
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create reservation',
      message: error.message
    });
  }
});

// GET /api/reservations/user/:userId - Get user's reservations
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
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
          lng
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

// DELETE /api/reservations/:id - Cancel/Delete reservation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if reservation exists and can be cancelled
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('status, start_time, charging_point_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }
      throw fetchError;
    }

    // Check if reservation can be cancelled
    if (['completed', 'active'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel active or completed reservations'
      });
    }

    // Update status to cancelled instead of deleting
    const { data: cancelledReservation, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Release charging point if it was reserved
    if (reservation.charging_point_id) {
      const { error: releaseError } = await supabase
        .from('charging_points')
        .update({
          status: 'Available',
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('point_id', reservation.charging_point_id);

      if (releaseError) {
        console.error('Failed to release charging point:', releaseError);
      } else {
        console.log(`✅ Charging point ${reservation.charging_point_id} released and set to Available`);
      }
    }

    res.json({
      success: true,
      data: cancelledReservation,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel reservation',
      message: error.message
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
        stations (
          id,
          name
        )
      `)
      .eq('station_id', stationId)
      .order('start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());
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

export default router;