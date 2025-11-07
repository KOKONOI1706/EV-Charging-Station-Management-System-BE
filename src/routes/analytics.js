import express from 'express';
import supabase from '../supabase/client.js';

const router = express.Router();

// GET /api/analytics/overview - Get general analytics overview
router.get('/overview', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get total stations
    const { count: totalStations } = await supabase
      .from('stations')
      .select('*', { count: 'exact', head: true });

    // Get active stations
    const { count: activeStations } = await supabase
      .from('stations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total reservations in period
    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get completed reservations in period
    const { count: completedReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get total revenue in period
    const { data: revenueData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

    // Get average session duration
    const { data: sessionData } = await supabase
      .from('reservations')
      .select('start_time, end_time, actual_start_time, actual_end_time')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    let averageSessionDuration = 0;
    if (sessionData && sessionData.length > 0) {
      const durations = sessionData
        .filter(session => session.actual_start_time && session.actual_end_time)
        .map(session => {
          const start = new Date(session.actual_start_time);
          const end = new Date(session.actual_end_time);
          return (end - start) / (1000 * 60); // Convert to minutes
        });
      
      if (durations.length > 0) {
        averageSessionDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
      }
    }

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalStations: totalStations || 0,
          activeStations: activeStations || 0,
          totalReservations: totalReservations || 0,
          completedReservations: completedReservations || 0,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          averageSessionDuration: parseFloat(averageSessionDuration.toFixed(2)),
          utilizationRate: totalStations > 0 ? parseFloat(((completedReservations || 0) / (totalStations * 100)).toFixed(2)) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics overview',
      message: error.message
    });
  }
});

// GET /api/analytics/reservations - Get reservation analytics
router.get('/reservations', async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get reservations by status
    const { data: statusData } = await supabase
      .from('reservations')
      .select('status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const statusCounts = statusData?.reduce((acc, reservation) => {
      acc[reservation.status] = (acc[reservation.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get reservations over time (simplified grouping)
    const { data: timeData } = await supabase
      .from('reservations')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by day/week/month
    const timeSeriesData = timeData?.reduce((acc, reservation) => {
      const date = new Date(reservation.created_at);
      let key;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!acc[key]) {
        acc[key] = { date: key, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      data: {
        period,
        groupBy,
        statusBreakdown: statusCounts,
        timeSeries: Object.values(timeSeriesData).sort((a, b) => a.date.localeCompare(b.date))
      }
    });
  } catch (error) {
    console.error('Error fetching reservation analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservation analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/stations - Get station analytics
router.get('/stations', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get station utilization data
    const { data: stationUsage } = await supabase
      .from('reservations')
      .select(`
        station_id,
        status,
        stations (
          id,
          name,
          city,
          total_spots
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Process station analytics
    const stationAnalytics = stationUsage?.reduce((acc, reservation) => {
      const stationId = reservation.station_id;
      const station = reservation.stations;
      
      if (!acc[stationId]) {
        acc[stationId] = {
          id: stationId,
          name: station?.name || 'Unknown',
          city: station?.city || 'Unknown',
          totalSpots: station?.total_spots || 1,
          totalReservations: 0,
          completedReservations: 0,
          cancelledReservations: 0,
          utilizationRate: 0
        };
      }
      
      acc[stationId].totalReservations++;
      
      if (reservation.status === 'completed') {
        acc[stationId].completedReservations++;
      } else if (reservation.status === 'cancelled') {
        acc[stationId].cancelledReservations++;
      }
      
      return acc;
    }, {}) || {};

    // Calculate utilization rates
    Object.values(stationAnalytics).forEach(station => {
      station.utilizationRate = station.totalReservations > 0 ? 
        parseFloat((station.completedReservations / station.totalReservations * 100).toFixed(2)) : 0;
    });

    // Get top performing stations
    const topStations = Object.values(stationAnalytics)
      .sort((a, b) => b.completedReservations - a.completedReservations)
      .slice(0, 10);

    // Get city distribution
    const cityDistribution = Object.values(stationAnalytics).reduce((acc, station) => {
      acc[station.city] = (acc[station.city] || 0) + station.totalReservations;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        period,
        stationAnalytics: Object.values(stationAnalytics),
        topStations,
        cityDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching station analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch station analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/revenue - Get revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get revenue data
    const { data: revenueData } = await supabase
      .from('payments')
      .select('amount, currency, payment_method, created_at, status')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    // Calculate totals
    const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const averageTransaction = revenueData?.length > 0 ? totalRevenue / revenueData.length : 0;

    // Group revenue by time period
    const revenueTimeSeries = revenueData?.reduce((acc, payment) => {
      const date = new Date(payment.created_at);
      let key;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!acc[key]) {
        acc[key] = { date: key, revenue: 0, transactions: 0 };
      }
      acc[key].revenue += payment.amount;
      acc[key].transactions++;
      return acc;
    }, {}) || {};

    // Payment method breakdown
    const paymentMethodBreakdown = revenueData?.reduce((acc, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      data: {
        period,
        groupBy,
        summary: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          averageTransaction: parseFloat(averageTransaction.toFixed(2)),
          totalTransactions: revenueData?.length || 0
        },
        timeSeries: Object.values(revenueTimeSeries).sort((a, b) => a.date.localeCompare(b.date)),
        paymentMethodBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/users - Get user analytics
router.get('/users', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get unique users who made reservations
    const { data: userActivity } = await supabase
      .from('reservations')
      .select('user_id, created_at, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Calculate user metrics
    const uniqueUsers = new Set(userActivity?.map(reservation => reservation.user_id) || []).size;
    
    const userReservationCounts = userActivity?.reduce((acc, reservation) => {
      acc[reservation.user_id] = (acc[reservation.user_id] || 0) + 1;
      return acc;
    }, {}) || {};

    const averageReservationsPerUser = uniqueUsers > 0 ? 
      Object.values(userReservationCounts).reduce((sum, count) => sum + count, 0) / uniqueUsers : 0;

    // Get user acquisition over time (simplified)
    const userAcquisition = userActivity?.reduce((acc, reservation) => {
      const date = new Date(reservation.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = new Set();
      }
      acc[date].add(reservation.user_id);
      return acc;
    }, {}) || {};

    const acquisitionTimeSeries = Object.entries(userAcquisition).map(([date, users]) => ({
      date,
      newUsers: users.size
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        period,
        summary: {
          uniqueUsers,
          averageReservationsPerUser: parseFloat(averageReservationsPerUser.toFixed(2)),
          totalReservations: userActivity?.length || 0
        },
        acquisitionTimeSeries
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics',
      message: error.message
    });
  }
});

export default router;