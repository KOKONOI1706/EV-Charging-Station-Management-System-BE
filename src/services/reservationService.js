import supabase from '../config/supabase.js';

/**
 * Reservation Status
 * - Confirmed: Reservation created, point locked
 * - Active: User started charging
 * - Completed: Charging finished
 * - Cancelled: User cancelled
 * - Expired: Time limit exceeded without starting
 */

class ReservationService {
  /**
   * Create a new reservation
   * Rules:
   * - Point must be Available
   * - User cannot have another active reservation
   * - User cannot have an active charging session
   */
  async createReservation({ userId, pointId, durationMinutes = 15 }) {
    try {
      // 1. Check if point is available
      const { data: point, error: pointError } = await supabase
        .from('charging_points')
        .select('point_id, status, station_id')
        .eq('point_id', pointId)
        .single();

      if (pointError) {
        throw new Error('Charging point not found');
      }

      if (point.status !== 'Available') {
        throw new Error(`Cannot reserve: Point is ${point.status}`);
      }

      // 2. Check if user has active reservation
      const { data: existingReservation } = await supabase
        .from('reservations')
        .select('reservation_id, point_id')
        .eq('user_id', userId)
        .in('status', ['Confirmed', 'Active'])
        .single();

      if (existingReservation) {
        throw new Error('You already have an active reservation');
      }

      // 3. Check if user has active session
      const { data: existingSession } = await supabase
        .from('charging_sessions')
        .select('session_id')
        .eq('user_id', userId)
        .eq('status', 'Active')
        .single();

      if (existingSession) {
        throw new Error('You already have an active charging session');
      }

      // 4. Create reservation
      const now = new Date();
      const expireTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

      const { data: reservation, error: createError } = await supabase
        .from('reservations')
        .insert([{
          user_id: userId,
          point_id: pointId,
          station_id: point.station_id,
          start_time: now.toISOString(),
          expire_time: expireTime.toISOString(),
          status: 'Confirmed',
          created_at: now.toISOString()
        }])
        .select(`
          *,
          charging_points (
            *,
            stations (*)
          )
        `)
        .single();

      if (createError) {
        throw createError;
      }

      console.log(`✅ Reservation created: ${reservation.reservation_id} for user ${userId}`);
      
      return {
        success: true,
        data: reservation,
        message: `Point reserved for ${durationMinutes} minutes`
      };
    } catch (error) {
      console.error('Error creating reservation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(reservationId, userId) {
    try {
      // Get reservation
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('reservation_id', reservationId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.status !== 'Confirmed') {
        throw new Error(`Cannot cancel: Reservation is ${reservation.status}`);
      }

      // Update status
      const { data: updated, error: updateError } = await supabase
        .from('reservations')
        .update({ 
          status: 'Cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('reservation_id', reservationId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Reservation cancelled: ${reservationId}`);

      return {
        success: true,
        data: updated,
        message: 'Reservation cancelled'
      };
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's active reservation
   */
  async getActiveReservation(userId) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          charging_points (
            *,
            stations (*)
          )
        `)
        .eq('user_id', userId)
        .in('status', ['Confirmed', 'Active'])
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
      console.error('Error fetching active reservation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Auto-expire reservations
   * Called by scheduler
   */
  async expireOldReservations() {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'Expired' })
        .eq('status', 'Confirmed')
        .lt('expire_time', now)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`⏰ Auto-expired ${data.length} reservations`);
      }

      return {
        success: true,
        expired: data?.length || 0
      };
    } catch (error) {
      console.error('Error expiring reservations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if reservation is still valid
   */
  async validateReservation(reservationId, userId) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('reservation_id', reservationId)
        .eq('user_id', userId)
        .eq('status', 'Confirmed')
        .single();

      if (error || !data) {
        return { valid: false, reason: 'Reservation not found or expired' };
      }

      // Check expiry
      const now = new Date();
      const expireTime = new Date(data.expire_time);
      
      if (now > expireTime) {
        // Auto-expire
        await supabase
          .from('reservations')
          .update({ status: 'Expired' })
          .eq('reservation_id', reservationId);

        return { valid: false, reason: 'Reservation expired' };
      }

      return { valid: true, reservation: data };
    } catch (error) {
      console.error('Error validating reservation:', error);
      return { valid: false, reason: error.message };
    }
  }
}

export default new ReservationService();
