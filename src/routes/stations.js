/**
 * ===============================================================
 * STATIONS ROUTES (BACKEND)
 * ===============================================================
 * Express routes xử lý các API liên quan đến trạm sạc
 * 
 * Endpoints:
 * - GET /api/stations - Lấy tất cả trạm (có filter theo location)
 * - GET /api/stations/:id - Lấy chi tiết 1 trạm theo ID
 * - POST /api/stations - Tạo trạm mới (Admin only)
 * - PUT /api/stations/:id - Cập nhật thông tin trạm (Admin only)
 * - DELETE /api/stations/:id - Xóa trạm (Admin only)
 * 
 * Features:
 * - 📍 Location filtering: Tính khoảng cách, filter theo radius (km)
 * - 🗺️ Distance calculation: Haversine formula (lat, lng)
 * - 📊 Sorting: Sắp xếp theo khoảng cách gần nhất
 * - 🔒 Authorization: CRUD operations yêu cầu Admin role
 * - ✅ Validation: Kiểm tra required fields (name, address, lat, lng, price)
 * 
 * Query params (GET /stations):
 * - lat, lng: Vị trí user để tính khoảng cách
 * - radius: Bán kính tìm kiếm (km), mặc định 50km
 * 
 * Dependencies:
 * - Supabase: Database stations table
 * - Middleware: requireAuth, requireAdmin (cho CRUD)
 * - Utils: calculateDistance() - Haversine formula
 */

import express from 'express';
import supabase from '../supabase/client.js';

const router = express.Router();

// GET /api/stations - Get all stations with optional location filtering
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    // Base query for all stations
    let query = supabase
      .from('stations')
      .select('*')
      .order('name');

    const { data: stations, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate distances and filter if location provided
    let enrichedStations = stations || [];
    
    if (lat && lng && stations) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = radius ? parseFloat(radius) : 50; // Default 50 km radius

      enrichedStations = stations.map(station => {
        const distance = calculateDistance(
          userLat, 
          userLng, 
          station.lat || station.latitude, 
          station.lng || station.longitude
        );
        return {
          ...station,
          distance_km: parseFloat(distance.toFixed(2))
        };
      });

      // Filter by radius
      enrichedStations = enrichedStations.filter(
        station => station.distance_km <= maxRadius
      );

      // Sort by distance
      enrichedStations.sort((a, b) => a.distance_km - b.distance_km);
    }

    res.json({
      success: true,
      data: enrichedStations,
      total: enrichedStations.length
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stations',
      message: error.message
    });
  }
});

// GET /api/stations/:id - Get station by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: station, error } = await supabase
      .from('stations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Station not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: station
    });
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch station',
      message: error.message
    });
  }
});

// POST /api/stations - Create new station (admin only)
router.post('/', async (req, res) => {
  try {
    const stationData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newStation, error } = await supabase
      .from('stations')
      .insert([stationData])
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    res.status(201).json({
      success: true,
      data: newStation,
      message: 'Station created successfully'
    });
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create station',
      message: error.message
    });
  }
});

// POST /api/stations/search - Search stations with filters
router.post('/search', async (req, res) => {
  try {
    const { 
      query, 
      filters = {},
      location = null 
    } = req.body;

    let supabaseQuery = supabase.from('stations').select('*');

    // Text search
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`
      );
    }

    // Availability filter
    if (filters.availability) {
      supabaseQuery = supabaseQuery.gt('available_spots', 0);
    }

    // Power filter
    if (filters.minPower) {
      supabaseQuery = supabaseQuery.gte('power_kw', filters.minPower);
    }

    // Connector type filter
    if (filters.connector) {
      supabaseQuery = supabaseQuery.ilike('connector', `%${filters.connector}%`);
    }

    // Status filter
    if (filters.status) {
      supabaseQuery = supabaseQuery.eq('status', filters.status);
    }

    const { data: stations, error } = await supabaseQuery.order('name');

    if (error) {
      throw error;
    }

    // Calculate distances if location provided
    let stationsWithDistance = stations || [];
    if (location && location.lat && location.lng) {
      stationsWithDistance = stations.map(station => {
        const distance = calculateDistance(
          location.lat, 
          location.lng, 
          station.lat || station.latitude, 
          station.lng || station.longitude
        );
        return {
          ...station,
          distance_km: parseFloat(distance.toFixed(2))
        };
      });

      // Apply distance filter if specified
      if (filters.maxDistance) {
        stationsWithDistance = stationsWithDistance.filter(
          station => station.distance_km <= filters.maxDistance
        );
      }

      // Sort by distance
      stationsWithDistance.sort((a, b) => a.distance_km - b.distance_km);
    }

    res.json({
      success: true,
      data: stationsWithDistance,
      total: stationsWithDistance.length,
      query,
      filters,
      location
    });
  } catch (error) {
    console.error('Error searching stations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search stations',
      message: error.message
    });
  }
});

// PUT /api/stations/:id - Update station (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔵 PUT /api/stations/:id - Updating station:', id);
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: updatedStation, error } = await supabase
      .from('stations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Station not found'
        });
      }
      throw error;
    }
    
    console.log('✅ Station updated successfully:', updatedStation.name);
    console.log('📤 Returning data with price_per_kwh:', updatedStation.price_per_kwh);

    res.json({
      success: true,
      data: updatedStation,
      message: 'Station updated successfully'
    });
  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update station',
      message: error.message
    });
  }
});

// PUT /api/stations/:id/availability - Update station availability
router.put('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { change } = req.body; // +1 or -1

    // Get current station data
    const { data: station, error: fetchError } = await supabase
      .from('stations')
      .select('available_spots, total_spots')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Station not found'
        });
      }
      throw fetchError;
    }

    const newAvailableSpots = Math.max(0, Math.min(
      station.total_spots, 
      station.available_spots + change
    ));

    const { data: updatedStation, error: updateError } = await supabase
      .from('stations')
      .update({ 
        available_spots: newAvailableSpots,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedStation,
      message: 'Station availability updated successfully'
    });
  } catch (error) {
    console.error('Error updating station availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update station availability',
      message: error.message
    });
  }
});

// DELETE /api/stations/:id - Delete station (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('stations')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Station deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete station',
      message: error.message
    });
  }
});

// Helper function to calculate distance between two points (in kilometers)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default router;