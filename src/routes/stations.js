import express from 'express';
import { StationModel } from '../models/Station.js';

const router = express.Router();

// GET /api/stations - Get all stations
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    let stations;
    if (lat && lng) {
      // Get stations within radius
      stations = await StationModel.getByLocation(
        parseFloat(lat), 
        parseFloat(lng), 
        radius ? parseFloat(radius) : 10
      );
    } else {
      // Get all stations
      stations = await StationModel.getAll();
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