/**
 * ===============================================================
 * STAFF STATISTICS ROUTES (BACKEND)
 * ===============================================================
 * Express routes cung cấp thống kê cho Staff Dashboard
 * 
 * Endpoints:
 * - GET /api/staff-stats/metrics - Lấy metrics của station
 * - GET /api/staff-stats/analytics - Lấy analytics data cho charts
 * 
 * Query params:
 * - stationId: UUID của station (hoặc 'all' cho tất cả stations)
 * - startDate: Ngày bắt đầu YYYY-MM-DD (optional, default = 7 days ago)
 * - endDate: Ngày kết thúc YYYY-MM-DD (optional, default = today)
 * 
 * Metrics calculation:
 * 
 * 1. todaysSessions:
 *    - Đếm sessions status=Completed trong date range
 *    - Filter theo station nếu có
 * 
 * 2. todaysRevenue:
 *    - Sum cost của completed sessions
 * 
 * 3. currentUtilization:
 *    - activeSessions / totalPoints * 100
 *    - activeSessions: Sessions có status=Active
 *    - totalPoints: Tổng số charging points của station
 * 
 * 4. averageSessionDuration:
 *    - Trung bình (end_time - start_time) của completed sessions
 *    - Đơn vị: Phút
 * 
 * 5. customerSatisfaction:
 *    - Mặc định 4.5 sao (TODO: fetch từ feedbacks table)
 * 
 * 6. maintenanceAlerts:
 *    - Đếm charging points có status=Maintenance hoặc Offline
 * 
 * 7. percentageChanges:
 *    - So sánh sessions/revenue với period trước
 *    - VD: Hôm nay vs hôm qua, tuần này vs tuần trước
 * 
 * Analytics data:
 * 
 * 1. dailyUsage:
 *    - Sessions và revenue theo ngày
 *    - Group by DATE(start_time)
 * 
 * 2. hourlyPattern:
 *    - Sessions theo giờ trong ngày (0-23h)
 *    - Utilization: % chỗ đang dùng theo giờ
 * 
 * 3. weeklyTrend:
 *    - Sessions và revenue theo ngày trong tuần
 *    - 7 ngày gần đây
 * 
 * 4. recentSessions:
 *    - 10 sessions gần đây nhất
 *    - Bao gồm: customer name, duration, amount, status
 * 
 * Station filtering:
 * - Nếu stationId='all': Lấy data của tất cả stations
 * - Nếu stationId=UUID: Chỉ lấy data của station đó
 * - Filter qua charging_points.station_id (join table)
 * 
 * Date range:
 * - Mặc định: 7 ngày gần đây
 * - startDate: 00:00:00
 * - endDate: 23:59:59
 * 
 * Dependencies:
 * - Supabase Admin: Query charging_sessions, charging_points
 * - Date calculations: start/end of day
 */

import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/staff-stats/metrics
 * Get staff dashboard metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const { stationId, startDate, endDate } = req.query;
    
    // Set date range - default to last 7 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999); // End of day
    
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) {
      start.setDate(start.getDate() - 7);
    }
    start.setHours(0, 0, 0, 0); // Start of day

    console.log('[Staff Stats] Getting metrics for stationId:', stationId, 'from', start.toISOString(), 'to', end.toISOString());

    // Get recent sessions within date range
    let query = supabaseAdmin
      .from('charging_sessions')
      .select('*, charging_points!inner(station_id)')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString());
    
    // Filter by station if provided via charging_points.station_id
    if (stationId && stationId !== 'all') {
      query = query.eq('charging_points.station_id', stationId);
    }
    
    const { data: recentSessions, error: sessionsError } = await query;
    
    console.log('[Staff Stats] Found sessions:', recentSessions?.length);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return res.status(500).json({ error: sessionsError.message });
    }

    // Calculate completed sessions
    const completedRecent = recentSessions?.filter(
      s => s.status?.toLowerCase() === 'completed' && s.cost != null
    ) || [];

    const todaysSessions = completedRecent.length;
    const todaysRevenue = completedRecent.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);

    // Get all charging points for utilization
    let pointsQuery = supabaseAdmin
      .from('charging_points')
      .select('point_id');
    
    // Filter by station if provided
    if (stationId && stationId !== 'all') {
      pointsQuery = pointsQuery.eq('station_id', stationId);
    }
    
    const { data: allPoints, error: pointsError } = await pointsQuery;

    if (pointsError) {
      console.error('Error fetching points:', pointsError);
      return res.status(500).json({ error: pointsError.message });
    }

    const totalPoints = allPoints?.length || 1;

    // Get active sessions
    let activeQuery = supabaseAdmin
      .from('charging_sessions')
      .select('session_id, charging_points!inner(station_id)')
      .eq('status', 'Active');
    
    // Filter by station if provided via charging_points.station_id
    if (stationId && stationId !== 'all') {
      activeQuery = activeQuery.eq('charging_points.station_id', stationId);
    }
    
    const { data: activeSessions, error: activeError } = await activeQuery;

    if (activeError) {
      console.error('Error fetching active sessions:', activeError);
      return res.status(500).json({ error: activeError.message });
    }

    const activeCount = activeSessions?.length || 0;
    const currentUtilization = Math.round((activeCount / totalPoints) * 100);

    // Calculate average session duration
    const sessionsWithDuration = completedRecent.filter(s => s.start_time && s.end_time);
    let averageSessionDuration = 0;

    if (sessionsWithDuration.length > 0) {
      const totalMinutes = sessionsWithDuration.reduce((sum, s) => {
        const start = new Date(s.start_time);
        const end = new Date(s.end_time);
        const minutes = (end - start) / (1000 * 60);
        return sum + minutes;
      }, 0);
      averageSessionDuration = Math.round(totalMinutes / sessionsWithDuration.length);
    }

    const metrics = {
      todaysSessions,
      todaysRevenue: Math.round(todaysRevenue * 100) / 100,
      currentUtilization,
      averageSessionDuration,
      customerSatisfaction: 4.5, // Placeholder
      maintenanceAlerts: 0, // Placeholder
      percentageChanges: {
        sessions: 15, // Placeholder
        revenue: 20, // Placeholder
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching staff metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/staff-stats/analytics
 * Get staff analytics data
 */
router.get('/analytics', async (req, res) => {
  try {
    const { stationId, startDate, endDate } = req.query;
    
    // Set date range - default to last 7 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999); // End of day
    
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) {
      start.setDate(start.getDate() - 7);
    }
    start.setHours(0, 0, 0, 0); // Start of day

    console.log('[Staff Analytics] Getting analytics for stationId:', stationId, 'from', start.toISOString(), 'to', end.toISOString());

    // Get sessions within date range - join with charging_points to filter by station
    let query = supabaseAdmin
      .from('charging_sessions')
      .select('*, charging_points!inner(station_id)')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: false });
    
    // Filter by station if provided via charging_points.station_id
    if (stationId && stationId !== 'all') {
      query = query.eq('charging_points.station_id', stationId);
    }
    
    const { data: sessions, error } = await query;
    
    console.log('[Staff Analytics] Found sessions:', sessions?.length);

    if (error) {
      console.error('Error fetching analytics:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get user names
    const userIds = [...new Set(sessions?.map(s => s.user_id).filter(Boolean))];
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('user_id, name')
      .in('user_id', userIds);

    const userMap = {};
    users?.forEach(u => {
      userMap[u.user_id] = u.name;
    });

    // Format recent sessions
    const recentSessions = (sessions || []).slice(0, 10).map(session => {
      const start = new Date(session.start_time);
      const end = session.end_time ? new Date(session.end_time) : new Date();
      const duration = Math.round((end - start) / (1000 * 60));

      return {
        id: session.session_id.toString(),
        customer: userMap[session.user_id] || 'Unknown',
        duration: `${duration} phút`,
        amount: parseFloat(session.cost) || 0,
        status: session.status || 'Unknown'
      };
    });

    // Daily usage - dynamic based on date range
    const dailyUsage = [];
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const daySessions = sessions?.filter(s => 
        s.start_time?.startsWith(dateStr) && 
        s.status?.toLowerCase() === 'completed'
      ) || [];

      dailyUsage.push({
        date: dateStr,
        sessions: daySessions.length,
        revenue: daySessions.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0)
      });
    }

    // Hourly pattern
    const hourlyPattern = Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = sessions?.filter(s => {
        const sessionHour = new Date(s.start_time).getHours();
        return sessionHour === hour;
      }) || [];

      return {
        hour,
        sessions: hourSessions.length,
        utilization: Math.min(100, hourSessions.length * 10)
      };
    });

    // Weekly trend
    const weeklyTrend = dailyUsage.map(day => ({
      day: new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
      sessions: day.sessions,
      revenue: day.revenue
    }));

    res.json({
      dailyUsage,
      hourlyPattern,
      weeklyTrend,
      recentSessions
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
