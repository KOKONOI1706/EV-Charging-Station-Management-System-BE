import { supabase } from '../config/supabase.js';

class ChargingSession {
  // Get all sessions (Admin only - with filters)
  static async getAll(filters = {}) {
    try {
      let query = supabase
        .from('charging_sessions')
        .select(`
          *,
          users:user_id (user_id, name, email),
          vehicles:vehicle_id (vehicle_id, plate_number, battery_capacity_kwh),
          charging_points:point_id (
            point_id, 
            name, 
            power_kw,
            stations:station_id (station_id, name, address)
          ),
          bookings:booking_id (booking_id, start_time, expire_time),
          payments:payment_id (payment_id, amount, status, date)
        `)
        .order('start_time', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.stationId) {
        query = query.eq('charging_points.station_id', filters.stationId);
      }
      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('start_time', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching all charging sessions:', error);
      throw error;
    }
  }

  // Get sessions by user (Driver sees their own sessions)
  static async getByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('charging_sessions')
        .select(`
          *,
          vehicles:vehicle_id (vehicle_id, plate_number, battery_capacity_kwh),
          charging_points:point_id (
            point_id, 
            name, 
            power_kw,
            stations:station_id (station_id, name, address)
          ),
          bookings:booking_id (booking_id, start_time, expire_time),
          payments:payment_id (payment_id, amount, status, date)
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user charging sessions:', error);
      throw error;
    }
  }

  // Get sessions by station (Staff sees sessions at their stations)
  static async getByStationId(stationId) {
    try {
      const { data, error } = await supabase
        .from('charging_sessions')
        .select(`
          *,
          users:user_id (user_id, name, email, phone),
          vehicles:vehicle_id (vehicle_id, plate_number, battery_capacity_kwh),
          charging_points:point_id (
            point_id, 
            name, 
            power_kw,
            station_id
          ),
          bookings:booking_id (booking_id, start_time, expire_time),
          payments:payment_id (payment_id, amount, status, date)
        `)
        .eq('charging_points.station_id', stationId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching station charging sessions:', error);
      throw error;
    }
  }

  // Get session by ID
  static async getById(sessionId) {
    try {
      const { data, error } = await supabase
        .from('charging_sessions')
        .select(`
          *,
          users:user_id (user_id, name, email, phone),
          vehicles:vehicle_id (vehicle_id, plate_number, battery_capacity_kwh),
          charging_points:point_id (
            point_id, 
            name, 
            power_kw,
            stations:station_id (station_id, name, address)
          ),
          bookings:booking_id (booking_id, start_time, expire_time),
          payments:payment_id (payment_id, amount, status, date)
        `)
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching charging session:', error);
      throw error;
    }
  }

  // Create new session
  static async create(sessionData) {
    try {
      const { data, error } = await supabase
        .from('charging_sessions')
        .insert([{
          user_id: sessionData.user_id,
          vehicle_id: sessionData.vehicle_id,
          point_id: sessionData.point_id,
          booking_id: sessionData.booking_id,
          start_time: sessionData.start_time || new Date().toISOString(),
          meter_start: sessionData.meter_start || 0,
          status: 'Active'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating charging session:', error);
      throw error;
    }
  }

  // End session and calculate cost
  static async endSession(sessionId, endData) {
    try {
      const session = await this.getById(sessionId);
      if (!session) throw new Error('Session not found');

      const energyConsumed = (endData.meter_end || 0) - (session.meter_start || 0);
      const idleFee = (endData.idle_minutes || 0) * (session.charging_points?.idle_fee_per_min || 0);
      const energyCost = energyConsumed * (session.charging_points?.price_rate || 0);
      const totalCost = energyCost + idleFee;

      const { data, error } = await supabase
        .from('charging_sessions')
        .update({
          end_time: endData.end_time || new Date().toISOString(),
          meter_end: endData.meter_end,
          energy_consumed_kwh: energyConsumed,
          idle_minutes: endData.idle_minutes || 0,
          idle_fee: idleFee,
          cost: totalCost,
          status: 'Completed'
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error ending charging session:', error);
      throw error;
    }
  }

  // Update session status
  static async updateStatus(sessionId, status) {
    try {
      const { data, error } = await supabase
        .from('charging_sessions')
        .update({ status })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  // Get session statistics
  static async getStatistics(filters = {}) {
    try {
      let query = supabase
        .from('charging_sessions')
        .select('session_id, energy_consumed_kwh, cost, status, start_time, end_time');

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.stationId) {
        query = query.eq('charging_points.station_id', filters.stationId);
      }
      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('start_time', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalSessions: data.length,
        activeSessions: data.filter(s => s.status === 'Active').length,
        completedSessions: data.filter(s => s.status === 'Completed').length,
        totalEnergyConsumed: data.reduce((sum, s) => sum + (parseFloat(s.energy_consumed_kwh) || 0), 0),
        totalRevenue: data.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0),
        averageSessionDuration: this.calculateAverageDuration(data),
      };

      return stats;
    } catch (error) {
      console.error('Error fetching session statistics:', error);
      throw error;
    }
  }

  static calculateAverageDuration(sessions) {
    const completedSessions = sessions.filter(s => s.end_time && s.start_time);
    if (completedSessions.length === 0) return 0;

    const totalMinutes = completedSessions.reduce((sum, s) => {
      const duration = new Date(s.end_time) - new Date(s.start_time);
      return sum + (duration / 1000 / 60); // Convert to minutes
    }, 0);

    return Math.round(totalMinutes / completedSessions.length);
  }
}

export default ChargingSession;
