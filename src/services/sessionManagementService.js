import supabase from '../config/supabase.js';
import reservationService from './reservationService.js';

/**
 * Charging Session Management Service
 * Handles session lifecycle: Start, Monitor, AlmostDone, Complete
 */

class SessionManagementService {
  /**
   * Start charging session
   * Rules:
   * - Must have valid reservation OR point must be Available
   * - User cannot have another active session
   * - Point must not be Occupied by another session
   */
  async startSession({ userId, pointId, reservationId, vehicleId, meterStart, initialBatteryPercent, targetBatteryPercent }) {
    try {
      // 1. Validate reservation if provided
      if (reservationId) {
        const validation = await reservationService.validateReservation(reservationId, userId);
        if (!validation.valid) {
          throw new Error(validation.reason);
        }
      }

      // 2. Check point availability
      const { data: point, error: pointError } = await supabase
        .from('charging_points')
        .select(`
          *,
          stations (
            id,
            name,
            price_per_kwh
          )
        `)
        .eq('point_id', pointId)
        .single();

      if (pointError) {
        throw new Error('Charging point not found');
      }

      // Allow starting if: Available, Reserved (by this user's reservation)
      if (!['Available', 'Reserved'].includes(point.status)) {
        throw new Error(`Cannot start: Point is ${point.status}`);
      }

      // 3. Check for active sessions on this point
      const { data: existingPointSession } = await supabase
        .from('charging_sessions')
        .select('session_id, user_id')
        .eq('point_id', pointId)
        .eq('status', 'Active')
        .single();

      if (existingPointSession) {
        throw new Error('Point is currently occupied by another session');
      }

      // 4. Check if user has active session
      const { data: existingUserSession } = await supabase
        .from('charging_sessions')
        .select('session_id')
        .eq('user_id', userId)
        .eq('status', 'Active')
        .single();

      if (existingUserSession) {
        throw new Error('You already have an active charging session');
      }

      // 5. Calculate estimated end time
      let estimatedEndTime = null;
      if (vehicleId && initialBatteryPercent !== undefined && targetBatteryPercent) {
        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('battery_capacity_kwh')
          .eq('vehicle_id', vehicleId)
          .single();

        if (vehicle && vehicle.battery_capacity_kwh) {
          const percentToCharge = targetBatteryPercent - initialBatteryPercent;
          const energyNeeded = (percentToCharge / 100) * vehicle.battery_capacity_kwh;
          const chargingPowerKw = point.power_kw || 7;
          const hoursNeeded = energyNeeded / chargingPowerKw;
          
          estimatedEndTime = new Date(Date.now() + hoursNeeded * 3600 * 1000).toISOString();
        }
      }

      // 6. Create session
      const now = new Date();
      const { data: session, error: createError } = await supabase
        .from('charging_sessions')
        .insert([{
          user_id: userId,
          vehicle_id: vehicleId || null,
          point_id: pointId,
          reservation_id: reservationId || null,
          start_time: now.toISOString(),
          meter_start: meterStart,
          initial_battery_percent: initialBatteryPercent || null,
          target_battery_percent: targetBatteryPercent || 100,
          estimated_completion_time: estimatedEndTime,
          estimated_end_time: estimatedEndTime,
          status: 'Active',
          created_at: now.toISOString()
        }])
        .select(`
          *,
          charging_points (
            *,
            stations (*)
          ),
          vehicles (*)
        `)
        .single();

      if (createError) {
        throw createError;
      }

      // 7. Update charging point status to InUse
      const { error: updatePointError } = await supabase
        .from('charging_points')
        .update({
          status: 'InUse',
          updated_at: now.toISOString(),
          last_seen_at: now.toISOString()
        })
        .eq('point_id', pointId);

      if (updatePointError) {
        console.error('Failed to update charging point status:', updatePointError);
      } else {
        console.log(`✅ Charging point ${pointId} status updated to InUse`);
      }

      console.log(`✅ Session started: ${session.session_id} for user ${userId}`);

      return {
        success: true,
        data: session,
        message: 'Charging session started'
      };
    } catch (error) {
      console.error('Error starting session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop charging session
   */
  async stopSession({ sessionId, userId, meterEnd, idleMinutes = 0 }) {
    try {
      // Get current session
      const { data: session, error: fetchError } = await supabase
        .from('charging_sessions')
        .select(`
          *,
          charging_points (
            point_id,
            power_kw,
            stations (
              price_per_kwh
            )
          ),
          vehicles (
            battery_capacity_kwh
          )
        `)
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'Active') {
        throw new Error(`Cannot stop: Session is ${session.status}`);
      }

      // Calculate final values
      const now = new Date();
      let startTimeStr = session.start_time;
      if (typeof startTimeStr === 'string' && !startTimeStr.endsWith('Z') && !startTimeStr.includes('+')) {
        startTimeStr = startTimeStr + 'Z';
      }
      const startTime = new Date(startTimeStr);
      const elapsedMs = now - startTime;
      const elapsedHours = elapsedMs / (1000 * 60 * 60);

      const chargingPowerKw = session.charging_points?.power_kw || 7;
      let energyConsumed = chargingPowerKw * elapsedHours;

      // Cap energy based on battery capacity
      const batteryCapacity = session.vehicles?.battery_capacity_kwh || 100;
      const initialBatteryPercent = session.initial_battery_percent || 0;
      const targetBatteryPercent = session.target_battery_percent || 100;
      const maxEnergyCanCharge = ((targetBatteryPercent - initialBatteryPercent) / 100) * batteryCapacity;
      const cappedEnergy = Math.min(energyConsumed, maxEnergyCanCharge, 200);

      energyConsumed = cappedEnergy;
      const finalMeterEnd = meterEnd || (session.meter_start + energyConsumed);

      // Calculate cost
      let pricePerKwh = session.charging_points?.stations?.price_per_kwh || 5000;
      if (pricePerKwh < 10) {
        pricePerKwh = pricePerKwh * 24000;
      }
      
      const energyCost = energyConsumed * pricePerKwh;
      const idleFeePerMin = 1000; // 1000 VND per minute
      const idleFee = idleMinutes * idleFeePerMin;
      const totalCost = energyCost + idleFee;

      // Update session
      const { data: updated, error: updateError } = await supabase
        .from('charging_sessions')
        .update({
          end_time: now.toISOString(),
          meter_end: parseFloat(finalMeterEnd.toFixed(2)),
          energy_consumed_kwh: parseFloat(energyConsumed.toFixed(2)),
          idle_minutes: parseInt(idleMinutes),
          idle_fee: idleFee,
          cost: Math.round(totalCost),
          status: 'Completed'
        })
        .eq('session_id', sessionId)
        .select(`
          *,
          charging_points (
            *,
            stations (*)
          )
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update charging point status back to Available
      const { error: updatePointError } = await supabase
        .from('charging_points')
        .update({
          status: 'Available',
          updated_at: now.toISOString(),
          last_seen_at: now.toISOString()
        })
        .eq('point_id', session.point_id);

      if (updatePointError) {
        console.error('Failed to update charging point status:', updatePointError);
      } else {
        console.log(`✅ Charging point ${session.point_id} status updated to Available`);
      }

      console.log(`✅ Session stopped: ${sessionId}`);

      return {
        success: true,
        data: updated,
        message: 'Charging session completed',
        summary: {
          energy_consumed_kwh: energyConsumed,
          energy_cost: energyCost,
          idle_minutes: idleMinutes,
          idle_fee: idleFee,
          total_cost: totalCost
        }
      };
    } catch (error) {
      console.error('Error stopping session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect sessions that are almost done (≈5 min left)
   * Called by scheduler
   */
  async detectAlmostDoneSessions() {
    try {
      const now = new Date();
      const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

      // Find sessions with estimated_end_time within 5 minutes
      const { data: sessions, error } = await supabase
        .from('charging_sessions')
        .select('session_id, point_id, estimated_end_time')
        .eq('status', 'Active')
        .not('estimated_end_time', 'is', null)
        .lte('estimated_end_time', fiveMinutesLater.toISOString())
        .gte('estimated_end_time', now.toISOString());

      if (error) {
        throw error;
      }

      if (!sessions || sessions.length === 0) {
        return { success: true, updated: 0 };
      }

      // Update charging points to AlmostDone
      const pointIds = sessions.map(s => s.point_id);
      const { data: updated, error: updateError } = await supabase
        .from('charging_points')
        .update({ status: 'AlmostDone' })
        .in('point_id', pointIds)
        .neq('status', 'AlmostDone')
        .select();

      if (updateError) {
        throw updateError;
      }

      console.log(`🟡 Detected ${updated?.length || 0} sessions almost done`);

      return {
        success: true,
        updated: updated?.length || 0
      };
    } catch (error) {
      console.error('Error detecting almost done sessions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's active session
   */
  async getActiveSession(userId) {
    try {
      const { data, error } = await supabase
        .from('charging_sessions')
        .select(`
          *,
          charging_points (
            *,
            stations (*)
          ),
          vehicles (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'Active')
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error fetching active session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new SessionManagementService();
