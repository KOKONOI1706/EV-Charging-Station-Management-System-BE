/**
 * ===============================================================
 * STATION MODEL (BACKEND)
 * ===============================================================
 * Sequelize-style model cho bảng stations trong Supabase
 * 
 * Chức năng:
 * - 📍 CRUD operations cho stations (trạm sạc)
 * - 🗺️ Location-based queries (tìm trạm theo lat/lng + radius)
 * - 🔍 Query với Supabase Admin client
 * 
 * Methods:
 * 
 * 1. getAll()
 *    - Lấy tất cả stations, sắp xếp theo created_at desc
 * 
 * 2. getById(id)
 *    - Lấy 1 station theo ID
 *    - Return single object
 * 
 * 3. create(stationData)
 *    - Tạo station mới
 *    - Required fields: name, address, lat, lng, price_per_kwh
 *    - Return created station object
 * 
 * 4. update(id, updates)
 *    - Cập nhật thông tin station
 *    - Return updated station object
 * 
 * 5. delete(id)
 *    - Xóa station
 *    - Return true nếu thành công
 * 
 * 6. getByLocation(latitude, longitude, radiusKm = 10)
 *    - Tìm stations trong bán kính radiusKm từ vị trí cho trước
 *    - Sử dụng PostGIS function: stations_within_radius
 *    - Mặc định radius = 10km
 * 
 * Database Schema (stations table):
 * - id: UUID (primary key)
 * - name: VARCHAR (tên trạm)
 * - address: TEXT (địa chỉ)
 * - lat: FLOAT (latitude)
 * - lng: FLOAT (longitude)
 * - price_per_kwh: DECIMAL (giá sạc/kWh)
 * - created_at: TIMESTAMP
 * - updated_at: TIMESTAMP
 * 
 * Dependencies:
 * - Supabase Admin: Full access client
 * - PostGIS: Extension cho location queries
 */

import { supabaseAdmin } from '../config/supabase.js';

export class StationModel {
  static async getAll() {
    try {
      const { data, error } = await supabaseAdmin
        .from('stations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stations:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('stations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching station by ID:', error);
      throw error;
    }
  }

  static async create(stationData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('stations')
        .insert([stationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating station:', error);
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      const { data, error } = await supabaseAdmin
        .from('stations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating station:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabaseAdmin
        .from('stations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting station:', error);
      throw error;
    }
  }

  static async getByLocation(latitude, longitude, radiusKm = 10) {
    try {
      // Using PostGIS ST_DWithin for location-based queries
      const { data, error } = await supabaseAdmin
        .rpc('stations_within_radius', {
          lat: latitude,
          lng: longitude,
          radius_km: radiusKm
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stations by location:', error);
      throw error;
    }
  }
}