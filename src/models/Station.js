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