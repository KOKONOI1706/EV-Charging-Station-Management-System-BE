import express from 'express';

const router = express.Router();

// Mock data for stations (sẽ được thay thế bằng database sau)
const mockStations = [
  {
    id: "station_001",
    name: "Central Mall Charging Hub",
    address: "123 Main Street, Downtown",
    latitude: 40.7128,
    longitude: -74.0060,
    status: "available",
    chargerType: "fast",
    price: 0.35,
    amenities: ["wifi", "cafe", "restroom"],
    totalSpots: 8,
    availableSpots: 5
  },
  {
    id: "station_002", 
    name: "Airport Express Station",
    address: "456 Airport Road",
    latitude: 40.6892,
    longitude: -74.1745,
    status: "available",
    chargerType: "ultra_fast",
    price: 0.45,
    amenities: ["wifi", "restaurant"],
    totalSpots: 12,
    availableSpots: 8
  }
];

// GET /api/stations - Get all stations
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockStations,
      total: mockStations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stations',
      message: error.message
    });
  }
});

// GET /api/stations/:id - Get station by ID
router.get('/:id', (req, res) => {
  try {
    const station = mockStations.find(s => s.id === req.params.id);
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch station',
      message: error.message
    });
  }
});

// POST /api/stations - Create new station (admin only)
router.post('/', (req, res) => {
  try {
    const newStation = {
      id: `station_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    mockStations.push(newStation);
    
    res.status(201).json({
      success: true,
      data: newStation,
      message: 'Station created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create station',
      message: error.message
    });
  }
});

export default router;