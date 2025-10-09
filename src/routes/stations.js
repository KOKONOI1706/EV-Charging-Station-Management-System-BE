import express from 'express';
import { StationModel } from '../models/Station.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// GET /api/stations - Get all stations
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    let query = supabaseAdmin
      .from('stations')
      .select(`
        station_id,
        name,
        address,
        latitude,
        longitude,
        total_points,
        status,
        created_at,
        charging_points!inner(
          point_id,
          name,
          status,
          power_kw,
          price_rate,
          connector_types(
            code,
            name,
            max_power_kw
          )
        )
      `)
      .eq('status', 'Available');

    // If coordinates provided, use the nearby stations function
    if (lat && lng) {
      const radiusKm = radius ? parseFloat(radius) : 10;
      const { data: nearbyStations, error } = await supabaseAdmin
        .rpc('find_nearby_stations', {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius_km: radiusKm
        });

      if (error) {
        console.error('Error finding nearby stations:', error);
        // Fallback to regular query
        const { data: stations, error: fallbackError } = await query;
        if (fallbackError) throw fallbackError;
        
        return res.json({
          success: true,
          data: stations || [],
          total: stations?.length || 0
        });
      }

      // Get detailed info for nearby stations
      const stationIds = nearbyStations.map(s => s.station_id);
      if (stationIds.length > 0) {
        const { data: detailedStations, error: detailError } = await supabaseAdmin
          .from('stations')
          .select(`
            station_id,
            name,
            address,
            latitude,
            longitude,
            total_points,
            status,
            created_at,
            charging_points(
              point_id,
              name,
              status,
              power_kw,
              price_rate,
              connector_types(
                code,
                name,
                max_power_kw
              )
            )
          `)
          .in('station_id', stationIds)
          .eq('status', 'Available');

        if (detailError) throw detailError;

        // Merge distance info
        const enrichedStations = detailedStations?.map(station => {
          const nearbyInfo = nearbyStations.find(ns => ns.station_id === station.station_id);
          return {
            ...station,
            distance_km: nearbyInfo?.distance_km || null,
            available_points: nearbyInfo?.available_points || 0
          };
        }) || [];

        return res.json({
          success: true,
          data: enrichedStations,
          total: enrichedStations.length
        });
      }
    }

    // Regular query for all stations
    const { data: stations, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate available points for each station
    const enrichedStations = stations?.map(station => ({
      ...station,
      available_points: station.charging_points?.filter(cp => cp.status === 'Available').length || 0
    })) || [];

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
    const station = await StationModel.getById(req.params.id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
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
    
    const newStation = await StationModel.create(stationData);
    
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

export default router;