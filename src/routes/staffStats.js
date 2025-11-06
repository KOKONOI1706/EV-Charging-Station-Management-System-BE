import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requireAdminOrStaff } from '../middleware/auth.js';

const router = express.Router();

// Protect staff stats: allow only admin or staff
router.use(authenticateToken);
router.use(requireAdminOrStaff);

/**
 * GET /api/staff-stats/metrics
 * Get staff dashboard metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get recent sessions (last 7 days)
    const { data: recentSessions, error: sessionsError } = await supabaseAdmin
      .from('charging_sessions')
      .select('*')
      .gte('start_time', sevenDaysAgo.toISOString());

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
    const { data: allPoints, error: pointsError } = await supabaseAdmin
      .from('charging_points')
      .select('point_id');

    if (pointsError) {
      console.error('Error fetching points:', pointsError);
      return res.status(500).json({ error: pointsError.message });
    }

    const totalPoints = allPoints?.length || 1;

    // Get active sessions
    const { data: activeSessions, error: activeError } = await supabaseAdmin
      .from('charging_sessions')
      .select('session_id')
      .eq('status', 'Active');

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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get sessions from last 7 days
    const { data: sessions, error } = await supabaseAdmin
      .from('charging_sessions')
      .select('*')
      .gte('start_time', sevenDaysAgo.toISOString())
      .order('start_time', { ascending: false });

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

    // Daily usage (last 7 days)
    const dailyUsage = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
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
