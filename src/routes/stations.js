import express from 'express';
import supabase from '../supabase/client.js';

const router = express.Router();

// GET /api/stations - Get all stations
router.get('/', async (req, res) => {
  try {
    const { data: stations, error } = await supabase
      .from('stations')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: stations,
      total: stations.length
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
    let stationsWithDistance = stations;
    if (location && location.lat && location.lng) {
      stationsWithDistance = stations.map(station => {
        const distance = calculateDistance(
          location.lat, 
          location.lng, 
          station.lat, 
          station.lng
        );
        return {
          ...station,
          distance: parseFloat(distance.toFixed(2))
        };
      });

      // Apply distance filter if specified
      if (filters.maxDistance) {
        stationsWithDistance = stationsWithDistance.filter(
          station => station.distance <= filters.maxDistance
        );
      }

      // Sort by distance
      stationsWithDistance.sort((a, b) => a.distance - b.distance);
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

// Helper function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
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