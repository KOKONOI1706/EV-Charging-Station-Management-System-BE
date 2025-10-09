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