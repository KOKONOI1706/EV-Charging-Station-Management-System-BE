import express from 'express';
import supabase from '../supabase/client.js';

const router = express.Router();

// POST /api/charging-sessions - Start a new charging session
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      vehicle_id,
      point_id,
      booking_id,
      meter_start
    } = req.body;

    // Validate required fields
    if (!user_id || !point_id || !meter_start) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, point_id, meter_start'
      });
    }

    // Validate meter_start value - must be reasonable (0 to 10,000 kWh)
    const parsedMeterStart = parseFloat(meter_start);
    if (isNaN(parsedMeterStart) || parsedMeterStart < 0 || parsedMeterStart > 10000) {
      return res.status(400).json({
        success: false,
        error: 'meter_start must be a number between 0 and 10,000 kWh'
      });
    }

    // Check if charging point exists and is available for charging
    const { data: chargingPoint, error: pointError } = await supabase
      .from('charging_points')
      .select(`
        *,
        stations (
          id,
          name,
          address,
          price_per_kwh
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

    // Check if point is available for charging (not in maintenance or offline)
    if (['Maintenance', 'Offline'].includes(chargingPoint.status)) {
      return res.status(400).json({
        success: false,
        error: `Charging point is not ready. Current status: ${chargingPoint.status}`
      });
    }

    // Check if there's an active session on this point
    const { data: activeSessions, error: sessionError } = await supabase
      .from('charging_sessions')
      .select('session_id, user_id, start_time')
      .eq('point_id', point_id)
      .eq('status', 'Active')
      .limit(1);

    if (sessionError) {
      throw sessionError;
    }

    if (activeSessions && activeSessions.length > 0) {
      const activeSession = activeSessions[0];
      
      // If it's the same user, auto-stop the old session
      if (activeSession.user_id === user_id) {
        console.log(`⚠️ User ${user_id} has an active session ${activeSession.session_id} on point ${point_id}, auto-stopping...`);
        
        // Auto-stop the old session with current meter reading
        await supabase
          .from('charging_sessions')
          .update({
            end_time: new Date().toISOString(),
            meter_end: meter_start, // Use new start as old end
            status: 'Completed',
            energy_consumed_kwh: 0, // No consumption recorded
            cost: 0
          })
          .eq('session_id', activeSession.session_id);
        
        console.log(`✅ Old session ${activeSession.session_id} auto-stopped`);
      } else {
        // Different user has active session
        return res.status(409).json({
          success: false,
          error: 'There is already an active charging session on this point by another user'
        });
      }
    }

    // Verify booking if booking_id is provided
    if (booking_id) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('status, point_id, user_id')
        .eq('booking_id', booking_id)
        .single();

      if (bookingError || !booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      if (booking.point_id !== point_id) {
        return res.status(400).json({
          success: false,
          error: 'Booking is for a different charging point'
        });
      }

      if (booking.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          error: 'Booking belongs to a different user'
        });
      }

      if (booking.status !== 'Confirmed') {
        return res.status(400).json({
          success: false,
          error: `Booking status must be Confirmed. Current status: ${booking.status}`
        });
      }
    }

    // Create charging session
    const sessionData = {
      user_id,
      vehicle_id: vehicle_id || null,
      point_id,
      booking_id: booking_id || null,
      start_time: new Date().toISOString(),
      meter_start: parsedMeterStart, // Use validated value
      status: 'Active',
      created_at: new Date().toISOString()
    };

    const { data: session, error: createError } = await supabase
      .from('charging_sessions')
      .insert([sessionData])
      .select(`
        *,
        charging_points (
          *,
          stations (
            id,
            name,
            address,
            city,
            price_per_kwh
          )
        ),
        vehicles (
          vehicle_id,
          plate_number,
          battery_capacity_kwh
        ),
        bookings (
          booking_id,
          start_time,
          expire_time
        )
      `)
      .single();

    if (createError) {
      throw createError;
    }

    // ✅ Update charging point status to "In Use"
    const { error: updatePointError } = await supabase
      .from('charging_points')
      .update({
        status: 'In Use',
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .eq('point_id', point_id);

    if (updatePointError) {
      console.error('Failed to update charging point status:', updatePointError);
    } else {
      console.log(`✅ Charging point ${point_id} status updated to "In Use"`);
    }

    res.status(201).json({
      success: true,
      data: session,
      message: 'Charging session started successfully'
    });
  } catch (error) {
    console.error('Error starting charging session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start charging session',
      message: error.message
    });
  }
});

// GET /api/charging-sessions - Get charging sessions
router.get('/', async (req, res) => {
  try {
    const { user_id, status, point_id, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('charging_sessions')
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
          power_kw,
          station_id,
          stations (
            id,
            name,
            address,
            city,
            lat,
            lng,
            price_per_kwh
          )
        ),
        vehicles (
          vehicle_id,
          plate_number,
          battery_capacity_kwh
        ),
        bookings (
          booking_id,
          start_time
        )
      `)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (point_id) {
      query = query.eq('point_id', point_id);
    }

    const { data: sessions, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: sessions,
      total: sessions.length
    });
  } catch (error) {
    console.error('Error fetching charging sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch charging sessions',
      message: error.message
    });
  }
});

// GET /api/charging-sessions/:id - Get session details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await supabase
      .from('charging_sessions')
      .select(`
        *,
        users (
          user_id,
          name,
          email,
          phone
        ),
        charging_points (
          *,
          stations (
            id,
            name,
            address,
            city,
            lat,
            lng,
            price_per_kwh,
            phone
          )
        ),
        vehicles (
          vehicle_id,
          plate_number,
          battery_capacity_kwh
        ),
        bookings (
          booking_id,
          start_time,
          expire_time,
          price_estimate
        ),
        payments (
          payment_id,
          amount,
          status,
          date
        )
      `)
      .eq('session_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Charging session not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching charging session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch charging session',
      message: error.message
    });
  }
});

// PUT /api/charging-sessions/:id/stop - Stop charging session
router.put('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const { meter_end, idle_minutes = 0 } = req.body;

    if (!meter_end) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: meter_end'
      });
    }

    // Get current session
    const { data: currentSession, error: fetchError } = await supabase
      .from('charging_sessions')
      .select(`
        *,
        charging_points (
          point_id,
          price_rate,
          idle_fee_per_min,
          stations (
            price_per_kwh
          )
        )
      `)
      .eq('session_id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        error: 'Charging session not found'
      });
    }

    if (currentSession.status !== 'Active') {
      return res.status(400).json({
        success: false,
        error: `Session is not active. Current status: ${currentSession.status}`
      });
    }

    // Calculate energy consumed
    const meterEnd = parseFloat(meter_end);
    const meterStart = parseFloat(currentSession.meter_start);
    const energyConsumed = meterEnd - meterStart;

    if (energyConsumed < 0) {
      return res.status(400).json({
        success: false,
        error: 'meter_end must be greater than meter_start'
      });
    }

    // Calculate costs
    const pricePerKwh = currentSession.charging_points.stations.price_per_kwh || 
                       currentSession.charging_points.price_rate || 5000;
    const energyCost = energyConsumed * pricePerKwh;
    
    const idleFeePerMin = currentSession.charging_points.idle_fee_per_min || 1000;
    const idleFee = idle_minutes * idleFeePerMin;
    
    const totalCost = energyCost + idleFee;

    // Update session
    const updateData = {
      end_time: new Date().toISOString(),
      meter_end: meterEnd,
      energy_consumed_kwh: energyConsumed,
      idle_minutes: parseInt(idle_minutes),
      idle_fee: idleFee,
      cost: totalCost,
      status: 'Completed'
    };

    const { data: session, error: updateError } = await supabase
      .from('charging_sessions')
      .update(updateData)
      .eq('session_id', id)
      .select(`
        *,
        charging_points (
          *,
          stations (
            id,
            name,
            address
          )
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // ✅ Update charging point status back to "Available"
    const { error: updatePointError } = await supabase
      .from('charging_points')
      .update({
        status: 'Available',
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .eq('point_id', currentSession.point_id);

    if (updatePointError) {
      console.error('Failed to update charging point status:', updatePointError);
    } else {
      console.log(`✅ Charging point ${currentSession.point_id} status updated to "Available"`);
    }

    // ✅ Update booking status to "Completed" if there's a booking
    if (currentSession.booking_id) {
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({
          status: 'Completed',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', currentSession.booking_id);

      if (updateBookingError) {
        console.error('Failed to update booking status:', updateBookingError);
      } else {
        console.log(`✅ Booking ${currentSession.booking_id} status updated to "Completed"`);
      }
    }

    res.json({
      success: true,
      data: session,
      message: 'Charging session stopped successfully',
      summary: {
        energy_consumed_kwh: energyConsumed,
        energy_cost: energyCost,
        idle_minutes: idle_minutes,
        idle_fee: idleFee,
        total_cost: totalCost
      }
    });
  } catch (error) {
    console.error('Error stopping charging session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop charging session',
      message: error.message
    });
  }
});

// GET /api/charging-sessions/active/user/:userId - Get user's active session
router.get('/active/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: session, error } = await supabase
      .from('charging_sessions')
      .select(`
        *,
        charging_points (
          *,
          stations (
            id,
            name,
            address,
            city,
            lat,
            lng,
            price_per_kwh
          )
        ),
        vehicles (
          vehicle_id,
          plate_number,
          battery_capacity_kwh
        ),
        bookings (
          booking_id,
          start_time,
          expire_time
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'Active')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!session) {
      return res.json({
        success: true,
        data: null,
        message: 'No active charging session found'
      });
    }

    // Calculate current session stats
    const now = new Date();
    const startTime = new Date(session.start_time);
    const durationMinutes = Math.floor((now - startTime) / 1000 / 60);

    res.json({
      success: true,
      data: {
        ...session,
        current_duration_minutes: durationMinutes
      }
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active session',
      message: error.message
    });
  }
});

// PUT /api/charging-sessions/:id/update-meter - Update meter reading during session
router.put('/:id/update-meter', async (req, res) => {
  try {
    const { id } = req.params;
    const { current_meter } = req.body;

    if (!current_meter) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: current_meter'
      });
    }

    // Get current session
    const { data: session, error: fetchError } = await supabase
      .from('charging_sessions')
      .select('meter_start, status')
      .eq('session_id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        error: 'Charging session not found'
      });
    }

    if (session.status !== 'Active') {
      return res.status(400).json({
        success: false,
        error: 'Session is not active'
      });
    }

    const currentEnergy = parseFloat(current_meter) - parseFloat(session.meter_start);

    res.json({
      success: true,
      data: {
        session_id: id,
        meter_start: session.meter_start,
        current_meter: current_meter,
        energy_consumed_so_far: currentEnergy
      },
      message: 'Meter reading updated'
    });
  } catch (error) {
    console.error('Error updating meter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update meter',
      message: error.message
    });
  }
});

export default router;
