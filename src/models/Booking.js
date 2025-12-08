/**
 * ===============================================================
 * BOOKING MODEL (BACKEND)
 * ===============================================================
 * Sequelize-style model cho bảng bookings trong Supabase
 * 
 * Chức năng:
 * - 📅 CRUD operations cho bookings (đặt chỗ sạc)
 * - 👤 Query bookings theo user_id
 * - 📍 Query bookings theo station_id
 * - ✅ Lấy active bookings (Pending, Confirmed, In Progress)
 * - 🔗 Join với bảng stations và users
 * 
 * Methods:
 * 
 * 1. getAll()
 *    - Lấy tất cả bookings với station + user info
 *    - Sắp xếp theo created_at desc
 * 
 * 2. getById(id)
 *    - Lấy 1 booking theo ID với relations
 *    - Return single object
 * 
 * 3. getByUserId(userId)
 *    - Lấy tất cả bookings của 1 user
 *    - Join với stations
 * 
 * 4. getByStationId(stationId)
 *    - Lấy tất cả bookings của 1 station
 *    - Join với users
 * 
 * 5. create(bookingData)
 *    - Tạo booking mới
 *    - Required fields: user_id, station_id, point_id, start_time, expire_time
 *    - Return created booking với relations
 * 
 * 6. update(id, updates)
 *    - Cập nhật booking (thường là status)
 *    - Return updated booking với relations
 * 
 * 7. delete(id)
 *    - Xóa booking
 *    - Return true nếu thành công
 * 
 * 8. getActiveBookings()
 *    - Lấy bookings với status: pending, confirmed, in_progress
 *    - Sắp xếp theo booking_date asc
 *    - Dùng cho hiển thị upcoming bookings
 * 
 * Database Schema (bookings table):
 * - booking_id: BIGINT (primary key)
 * - user_id: BIGINT (foreign key → users)
 * - point_id: BIGINT (foreign key → charging_points)
 * - start_time: TIMESTAMP (thời gian bắt đầu)
 * - expire_time: TIMESTAMP (thời gian hết hạn)
 * - status: VARCHAR (Pending, Confirmed, Canceled, Completed)
 * - created_at: TIMESTAMP
 * 
 * Dependencies:
 * - Supabase Admin: Full access client
 * - Relations: stations, users, charging_points
 */

import { supabaseAdmin } from '../config/supabase.js';

export class BookingModel {
  static async getAll() {
    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          station:stations(*),
          user:users(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          station:stations(*),
          user:users(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching booking by ID:', error);
      throw error;
    }
  }

  static async getByUserId(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          station:stations(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching bookings by user ID:', error);
      throw error;
    }
  }

  static async getByStationId(stationId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          user:users(id, name, email)
        `)
        .eq('station_id', stationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching bookings by station ID:', error);
      throw error;
    }
  }

  static async create(bookingData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .insert([bookingData])
        .select(`
          *,
          station:stations(*),
          user:users(id, name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          station:stations(*),
          user:users(id, name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }

  static async getActiveBookings() {
    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          station:stations(*),
          user:users(id, name, email)
        `)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('booking_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching active bookings:', error);
      throw error;
    }
  }
}