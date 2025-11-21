import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/requireRole.js';

const router = express.Router();

// GET /api/admin/stats - Get all dashboard statistics (Admin only)
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('\n=== ADMIN STATS REQUEST START ===');
    console.log('1. Fetching revenue...');
    const revenue = await getRevenueStats();
    
    console.log('2. Fetching top stations...');
    const topStations = await getTopStations();
    
    console.log('3. Fetching system alerts...');
    const systemAlerts = await getSystemAlerts();
    
    console.log('4. Fetching recent activities...');
    const recentActivities = await getRecentActivities();

    res.json({
      success: true,
      revenue,
      topStations,
      systemAlerts,
      recentActivities
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin statistics'
    });
  }
});

// Helper function to get revenue statistics
async function getRevenueStats() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  console.log('Revenue calculation periods:');
  console.log('  Last 24h:', last24h.toISOString());
  console.log('  Week start:', weekStart.toISOString());
  console.log('  Month start:', monthStart.toISOString());
  console.log('  Year start:', yearStart.toISOString());

  // Get completed sessions for different periods
  const { data: sessions, error } = await supabaseAdmin
    .from('charging_sessions')
    .select('cost, end_time, start_time')
    .eq('status', 'Completed')
    .gte('end_time', last24h.toISOString());

  if (error) {
    console.error('Error fetching revenue:', error);
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      yearToDate: 0,
      trend: { value: 0, isPositive: true }
    };
  }

  const last24hSessions = sessions?.filter(s => new Date(s.end_time) >= last24h) || [];
  const weekSessions = sessions?.filter(s => new Date(s.end_time) >= weekStart) || [];
  const monthSessions = sessions?.filter(s => new Date(s.end_time) >= monthStart) || [];
  const yearSessions = sessions?.filter(s => new Date(s.end_time) >= yearStart) || [];

  console.log('  Last 24h sessions:', last24hSessions.length, last24hSessions.length > 0 ? '\n    Sample: ' + JSON.stringify(last24hSessions[0]) : '');
  console.log('  Week sessions:', weekSessions.length);
  console.log('  Month sessions:', monthSessions.length);
  console.log('  Year sessions:', yearSessions.length);

  const today = last24hSessions.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  const thisWeek = weekSessions.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  const thisMonth = monthSessions.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  const yearToDate = yearSessions.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);

  console.log('Revenue totals:', { today, thisWeek, thisMonth, yearToDate });

  return {
    today,
    thisWeek,
    thisMonth,
    yearToDate,
    trend: {
      value: today > 0 ? 8 : 0,
      isPositive: true
    }
  };
}

// Helper function to get top performing stations
async function getTopStations(limit = 4) {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('\n=== FETCHING TOP STATIONS ===');
    console.log('   Period: Last 30 days from', last30Days.toISOString());

    // Step 1: Get all completed sessions
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('charging_sessions')
      .select('session_id, point_id, cost, end_time')
      .eq('status', 'Completed')
      .gte('end_time', last30Days.toISOString());

    if (sessionsError) {
      console.error('   Error fetching sessions:', sessionsError.message);
      return [];
    }

    console.log('   Found', sessions?.length || 0, 'completed sessions');
    
    if (!sessions || sessions.length === 0) {
      console.log('   No sessions found');
      return [];
    }

    // Step 2: Get unique point_ids
    const pointIds = [...new Set(sessions.map(s => s.point_id))];
    console.log('   Unique charging points:', pointIds.length);

    // Step 3: Get charging points (without nested select)
    const { data: points, error: pointsError } = await supabaseAdmin
      .from('charging_points')
      .select('point_id, station_id')
      .in('point_id', pointIds);

    if (pointsError) {
      console.error('   Error fetching points:', pointsError.message);
      return [];
    }

    console.log('   Found', points?.length || 0, 'charging points');

    // Step 4: Get unique station_ids
    const stationIds = [...new Set(points?.map(p => p.station_id) || [])];
    console.log('   Unique stations:', stationIds.length);

    // Step 5: Get station details separately (use 'id' not 'station_id')
    const { data: stations, error: stationsError } = await supabaseAdmin
      .from('stations')
      .select('id, name, address')
      .in('id', stationIds);

    if (stationsError) {
      console.error('   Error fetching stations:', stationsError.message);
      return [];
    }

    console.log('   Found', stations?.length || 0, 'station details');

    // Step 6: Build station revenue map
    const stationMap = {};
    
    sessions.forEach(session => {
      const point = points?.find(p => p.point_id === session.point_id);
      if (point) {
        const station = stations?.find(s => s.id === point.station_id);
        if (station) {
          const stationId = station.id;
          if (!stationMap[stationId]) {
            stationMap[stationId] = {
              id: stationId.toString(),
              name: station.name,
              location: station.address || 'Ho Chi Minh City',
              revenue: 0,
              period: '30 ngày qua',
              sessionCount: 0
            };
          }
          stationMap[stationId].revenue += parseFloat(session.cost || 0);
          stationMap[stationId].sessionCount++;
        }
      }
    });

    console.log('   Unique stations with revenue:', Object.keys(stationMap).length);

    // Step 7: Sort and return top stations
    const topStations = Object.values(stationMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    console.log('   Top', limit, 'stations:');
    topStations.forEach((s, i) => {
      console.log(`      ${i + 1}. ${s.name}: ${s.revenue.toLocaleString('vi-VN')} VND (${s.sessionCount} sessions)`);
    });

    return topStations;
    
  } catch (error) {
    console.error('Error in getTopStations:', error);
    return [];
  }
}

// Helper function to get system alerts
async function getSystemAlerts() {
  const alerts = [];

  try {
    const { data: sessions } = await supabaseAdmin
      .from('charging_sessions')
      .select('status')
      .eq('status', 'Active');

    const activeSessions = sessions?.length || 0;

    alerts.push({
      id: '1',
      type: 'info',
      message: activeSessions > 0 
        ? `${activeSessions} phiên sạc đang hoạt động` 
        : 'Hệ thống hoạt động bình thường',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    alerts.push({
      id: '1',
      type: 'info',
      message: 'Hệ thống hoạt động bình thường',
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
}

// Helper function to get recent activities
async function getRecentActivities(limit = 5) {
  try {
    // Step 1: Get recent sessions
    const { data: sessions, error } = await supabaseAdmin
      .from('charging_sessions')
      .select('session_id, start_time, end_time, status, cost, user_id')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Step 2: Get user_ids
    const userIds = [...new Set(sessions.map(s => s.user_id))];

    // Step 3: Get user details separately
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('user_id, full_name')
      .in('user_id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Step 4: Map sessions to activities
    const activities = sessions?.map(session => {
      const user = users?.find(u => u.user_id === session.user_id);
      return {
        id: session.session_id.toString(),
        user: user?.full_name || 'Unknown User',
        action: session.status === 'Completed' 
          ? `Hoàn thành phiên sạc - ${Math.round((new Date(session.end_time) - new Date(session.start_time)) / 60000)} phút`
          : session.status === 'Active'
          ? 'Đang sạc'
          : `Phiên sạc ${session.status}`,
        timestamp: session.start_time,
        type: session.status === 'Completed' ? 'success' : 'info'
      };
    }) || [];

    return activities;
    
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return [];
  }
}

export default router;
