/**
 * ===============================================================
 * RESERVATION SERVICE (BACKEND)
 * ===============================================================
 * Service quản lý reservations với auto-expiry
 * 
 * Chức năng:
 * - 🎫 Tạo reservation (giữ chỗ 15 phút)
 * - ⏰ Auto-expire reservations cũ (chạy bởi scheduler)
 * - ✅ Validate reservation trước khi start session
 * - ❌ Cancel reservation
 * - 🔄 Cập nhật trạng thái charging point
 * 
 * Reservation Status Flow:
 * - Confirmed: Vừa tạo, đang giữ chỗ
 * - Active: User bắt đầu sạc (completeReservation)
 * - Expired: Hết 15 phút chưa check-in
 * - Cancelled: User hủy
 * - Completed: Session hoàn thành
 * 
 * Methods:
 * 
 * 1. createReservation({ userId, pointId, durationMinutes })
 *    - Kiểm tra charging point Available
 *    - Kiểm tra user không có reservation/session active khác
 *    - Tạo booking record với expire_time = now + 15 phút
 *    - Return booking_id, expire_time
 * 
 * 2. expireOldReservations()
 *    - Tìm bookings có expire_time < now và status=Confirmed
 *    - Cập nhật status = Expired
 *    - Release charging points (không cập nhật - vì không lock point)
 *    - Return { expired: count }
 * 
 * 3. validateReservation(reservationId, userId)
 *    - Kiểm tra reservation tồn tại
 *    - Kiểm tra user sở hữu reservation
 *    - Kiểm tra chưa expire
 *    - Kiểm tra status = Confirmed
 *    - Return { valid: boolean, reason: string }
 * 
 * 4. cancelReservation(reservationId, userId)
 *    - Validate ownership
 *    - Cập nhật status = Cancelled
 *    - Return success/error
 * 
 * 5. getActiveReservation(userId)
 *    - Lấy reservation status=Confirmed chưa expire
 *    - Tính remainingSeconds = expire_time - now
 *    - Return reservation + remainingSeconds
 * 
 * Database schema (bookings table):
 * - booking_id: BIGINT
 * - user_id: BIGINT
 * - point_id: BIGINT
 * - station_id: UUID
 * - start_time: TIMESTAMP (thời điểm tạo)
 * - expire_time: TIMESTAMP (start_time + 15 phút)
 * - status: VARCHAR (Confirmed, Active, Expired, Cancelled)
 * 
 * Timezone handling:
 * - Lưu ISO strings trong database
 * - Tính toán thời gian bằng JavaScript Date
 * - Log ra console để debug timezone issues
 * 
 * Dependencies:
 * - Supabase: Database operations
 * - chargingScheduler: Gọi expireOldReservations() mỗi 30s
 */

import supabase from '../supabase/client.js';

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
      // Ensure pointId is an integer
      const pointIdInt = parseInt(pointId);
      console.log('🔍 Creating reservation for:', { userId, pointId, pointIdInt, durationMinutes });
      
      // Debug: Check all charging points in database
      const { data: allPoints } = await supabase
        .from('charging_points')
        .select('point_id, name, status, station_id')
        .limit(20);
      
      console.log('🔍 Available charging points in database:', allPoints?.map(p => ({ 
        id: p.point_id, 
        name: p.name, 
        status: p.status,
        station: p.station_id 
      })));
      
      // 1. Check if point is available
      const { data: point, error: pointError } = await supabase
        .from('charging_points')
        .select('point_id, status, station_id')
        .eq('point_id', pointIdInt)
        .single();

      console.log('📊 Query result:', { point, pointError });

      if (pointError) {
        console.error('❌ Point lookup error:', pointError);
        throw new Error(`Charging point ${pointIdInt} not found. Please check the charging point ID.`);
      }

      if (point.status !== 'Available') {
        throw new Error(`Cannot reserve: Point is ${point.status}`);
      }

      // 2. Check if user has active reservation
      const { data: existingReservation } = await supabase
        .from('bookings')
        .select('booking_id, point_id')
        .eq('user_id', userId)
        .in('status', ['Confirmed', 'Active'])
        .maybeSingle();

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

      // 4. Create reservation (booking)
      const now = new Date();
      const expireTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

      console.log('🕐 Backend time calculation:', {
        now: now.toISOString(),
        nowLocal: now.toString(),
        expireTime: expireTime.toISOString(),
        expireTimeLocal: expireTime.toString(),
        durationMinutes,
        diffMs: expireTime.getTime() - now.getTime(),
        diffMinutes: (expireTime.getTime() - now.getTime()) / 1000 / 60
      });

      const { data: reservation, error: createError } = await supabase
        .from('bookings')
        .insert([{
          user_id: userId,
          point_id: pointIdInt,
          station_id: point.station_id,
          start_time: now.toISOString(),
          expire_time: expireTime.toISOString(),
          status: 'Confirmed',
          confirmed_at: now.toISOString(),
          created_at: now.toISOString()
        }])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // 5. Update charging point status to Reserved
      const { error: updatePointError } = await supabase
        .from('charging_points')
        .update({ 
          status: 'Reserved',
          updated_at: now.toISOString()
        })
        .eq('point_id', pointIdInt);

      if (updatePointError) {
        console.error('Failed to update point status:', updatePointError);
        // Rollback reservation if point update fails
        await supabase
          .from('bookings')
          .delete()
          .eq('booking_id', reservation.booking_id);
        throw new Error('Failed to reserve charging point');
      }

      console.log(`✅ Reservation created: ${reservation.booking_id} for user ${userId}`);
      console.log(`🔒 Charging point ${pointIdInt} status changed to Reserved`);
      
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
        .from('bookings')
        .select('*')
        .eq('booking_id', reservationId)
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
        .from('bookings')
        .update({ 
          status: 'Cancelled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', reservationId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Release the charging point
      await supabase
        .from('charging_points')
        .update({ 
          status: 'Available',
          updated_at: new Date().toISOString()
        })
        .eq('point_id', reservation.point_id);

      console.log(`✅ Reservation cancelled: ${reservationId}`);
      console.log(`🔓 Charging point ${reservation.point_id} released (Available)`);

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
        .from('bookings')
        .select('*')
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

      // Get expired reservations before updating
      const { data: expiredReservations, error: fetchError } = await supabase
        .from('bookings')
        .select('booking_id, point_id')
        .eq('status', 'Confirmed')
        .lt('expire_time', now);

      if (fetchError) {
        throw fetchError;
      }

      if (!expiredReservations || expiredReservations.length === 0) {
        return { success: true, expired: 0 };
      }

      // Update reservation status
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'Expired' })
        .eq('status', 'Confirmed')
        .lt('expire_time', now)
        .select();

      if (error) {
        throw error;
      }

      // Release all charging points
      const pointIds = expiredReservations.map(r => r.point_id);
      if (pointIds.length > 0) {
        await supabase
          .from('charging_points')
          .update({ 
            status: 'Available',
            updated_at: new Date().toISOString()
          })
          .in('point_id', pointIds);
      }

      if (data && data.length > 0) {
        console.log(`⏰ Auto-expired ${data.length} reservations`);
        console.log(`🔓 Released ${pointIds.length} charging points`);
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
