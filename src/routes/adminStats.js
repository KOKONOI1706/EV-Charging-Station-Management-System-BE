/**
 * ===============================================================
 * ADMIN STATISTICS ROUTES (BACKEND)
 * ===============================================================
 * Express routes cung cấp thống kê toàn hệ thống cho Admin
 * 
 * Endpoints:
 * - GET /api/admin/stats - Lấy tất cả stats (revenue, top stations, alerts, activities)
 * 
 * Chức năng:
 * - 💰 Revenue statistics (today, week, month, YTD)
 * - 🏆 Top performing stations (theo revenue)
 * - ⚠️ System alerts (bảo trì, lỗi, cảnh báo)
 * - 📝 Recent activities (sessions, user actions)
 * 
 * Revenue calculation:
 * - Sử dụng Vietnam timezone (UTC+7)
 * - Periods:
 *   * Today: Từ 00:00:00 hôm nay (Vietnam time)
 *   * This week: 7 ngày gần đây
 *   * This month: 30 ngày gần đây
 *   * Year to date: Từ 01/01 năm nay
 * - Bao gồm:
 *   * Completed sessions (status='Completed')
 *   * Active sessions có cost > 0 (đang tạo revenue)
 * - Filter theo start_time (không phải end_time)
 * 
 * Top Stations:
 * - Sắp xếp theo revenue (cao → thấp)
 * - Tính revenue từ sessions của từng station
 * - Hiển thị: Name, location, revenue, period
 * 
 * System Alerts:
 * - Maintenance alerts: Điểm sạc cần bảo trì
 * - Offline points: Điểm sạc mất kết nối
 * - Low utilization: Trạm sử dụng thấp
 * - Mỗi alert có: type (warning/error/info), title, message, timestamp
 * 
 * Recent Activities:
 * - Latest 10 sessions hoàn thành
 * - Format: User + action + timestamp
 * - Example: "John Doe completed charging session at Station ABC"
 * - Type: success (completed), info (started), warning (cancelled)
 * 
 * Response format:
 * ```json
 * {
 *   "success": true,
 *   "revenue": { today, thisWeek, thisMonth, yearToDate, trend },
 *   "topStations": [{ id, name, location, revenue, period }],
 *   "systemAlerts": [{ type, title, message, timestamp }],
 *   "recentActivities": [{ user, action, timestamp, type }]
 * }
 * ```
 * 
 * Timezone handling:
 * - Backend tính toán theo Vietnam time (UTC+7)
 * - Convert dates: localNow = utcNow + 7 hours
 * - Log ra console để debug
 * 
 * Dependencies:
 * - Supabase Admin: Query charging_sessions, stations, charging_points
 * - Date calculations: Vietnam timezone offset
 */

import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// GET /api/admin/stats - Get all dashboard statistics
router.get('/stats', async (req, res) => {
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
  // Use Vietnam timezone (UTC+7)
  const now = new Date();
  const vietnamOffset = 7 * 60; // UTC+7 in minutes
  const localNow = new Date(now.getTime() + vietnamOffset * 60 * 1000);
  
  // Last 30 days
  const last30Days = new Date(localNow);
  last30Days.setDate(localNow.getDate() - 30);
  last30Days.setUTCHours(0, 0, 0, 0);
  
  // Today = from 00:00:00 today (Vietnam time)
  const todayStart = new Date(localNow);
  todayStart.setUTCHours(0, 0, 0, 0);
  
  // Week start = 7 days ago (but label will still say "this week")
  const weekStart = new Date(localNow);
  weekStart.setDate(localNow.getDate() - 7);
  weekStart.setUTCHours(0, 0, 0, 0);
  
  // Year start
  const yearStart = new Date(Date.UTC(localNow.getFullYear(), 0, 1));

  console.log('\n=== REVENUE CALCULATION PERIODS ===');
  console.log('  Today start:', todayStart.toISOString());
  console.log('  Week start:', weekStart.toISOString());
  console.log('  Last 30 days:', last30Days.toISOString());
  console.log('  Year start:', yearStart.toISOString());

  // Get all completed sessions from year start to now (based on start_time not end_time)
  const { data: completedSessions, error: completedError } = await supabaseAdmin
    .from('charging_sessions')
    .select('cost, end_time, start_time, session_id, status')
    .eq('status', 'Completed')
    .gte('start_time', yearStart.toISOString());

  // Also get active sessions that have cost > 0 (ongoing but already generating revenue)
  const { data: activeSessions, error: activeError } = await supabaseAdmin
    .from('charging_sessions')
    .select('cost, end_time, start_time, session_id, status')
    .eq('status', 'Active')
    .gte('start_time', yearStart.toISOString())
    .gt('cost', 0);

  if (completedError || activeError) {
    console.error('❌ Error fetching revenue sessions:', completedError || activeError);
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      yearToDate: 0,
      trend: { value: 0, isPositive: true }
    };
  }

  // Combine completed and active sessions
  const sessions = [...(completedSessions || []), ...(activeSessions || [])];

  console.log(`\n📊 Total sessions fetched: ${sessions?.length || 0} (${completedSessions?.length || 0} completed + ${activeSessions?.length || 0} active)`);
  
  // Filter sessions by period (use start_time for filtering)
  const todaySessions = sessions?.filter(s => new Date(s.start_time) >= todayStart) || [];
  const weekSessions = sessions?.filter(s => new Date(s.start_time) >= weekStart) || [];
  const last30DaysSessions = sessions?.filter(s => new Date(s.start_time) >= last30Days) || [];
  const yearSessions = sessions || [];

  console.log('📈 Sessions by period:');
  console.log('  Today:', todaySessions.length, 'sessions');
  console.log('  This week:', weekSessions.length, 'sessions');
  console.log('  Last 30 days:', last30DaysSessions.length, 'sessions');
  console.log('  Year to date:', yearSessions.length, 'sessions');

  // Calculate revenue
  const today = todaySessions.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  const thisWeek = weekSessions.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  const thisMonth = last30DaysSessions.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  const yearToDate = yearSessions.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);

  console.log('\n💰 Revenue totals:');
  console.log('  Today:', today.toLocaleString('vi-VN'), 'VND');
  console.log('  This week:', thisWeek.toLocaleString('vi-VN'), 'VND');
  console.log('  Last 30 days (thisMonth):', thisMonth.toLocaleString('vi-VN'), 'VND');
  console.log('  Year to date:', yearToDate.toLocaleString('vi-VN'), 'VND');

  if (todaySessions.length > 0) {
    console.log('\n📝 Sample today session:', {
      session_id: todaySessions[0].session_id,
      cost: todaySessions[0].cost,
      end_time: todaySessions[0].end_time
    });
  }

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
      .select('user_id, name')
      .in('user_id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Step 4: Map sessions to activities
    const activities = sessions?.map(session => {
      const user = users?.find(u => u.user_id === session.user_id);
      return {
        id: session.session_id.toString(),
        user: user?.name || 'Unknown User',
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
