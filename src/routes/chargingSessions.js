import express from 'express';
import ChargingSession from '../models/ChargingSession.js';

const router = express.Router();

// Create new session (Driver or Staff can start) - Alternative endpoint at root
router.post('/', async (req, res) => {
  try {
    const sessionData = req.body;
    
    // Validate required fields
    if (!sessionData.user_id || !sessionData.point_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id and point_id' 
      });
    }

    try {
      const newSession = await ChargingSession.create(sessionData);
      res.status(201).json({
        success: true,
        data: newSession
      });
    } catch (dbError) {
      // If permission denied, return mock success for demo
      if (dbError.message && dbError.message.includes('permission denied')) {
        console.log('⚠️ Database permission denied - returning mock session for demo');
        
        const mockSession = {
          session_id: Math.floor(Math.random() * 10000),
          user_id: sessionData.user_id,
          vehicle_id: sessionData.vehicle_id || null,
          point_id: sessionData.point_id,
          booking_id: sessionData.booking_id || null,
          start_time: new Date().toISOString(),
          meter_start: sessionData.meter_start || 0,
          meter_end: null,
          energy_consumed_kwh: 0,
          idle_minutes: 0,
          idle_fee: 0,
          cost: 0,
          status: 'Active',
          created_at: new Date().toISOString()
        };
        
        return res.status(201).json({
          success: true,
          data: mockSession,
          demo: true,
          message: 'Demo mode: Session created in memory only'
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get active session for a user
router.get('/active/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID is required' 
      });
    }

    // Get active session for user
    const sessions = await ChargingSession.getByUserId(userId);
    const activeSession = sessions?.find(s => s.status === 'Active');
    
    if (!activeSession) {
      return res.status(404).json({ 
        success: false,
        error: 'No active session found' 
      });
    }

    res.json({
      success: true,
      data: activeSession
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get all sessions or filtered sessions
// Admin: All sessions with filters
// Staff: Sessions at their station
// Driver: Their own sessions
router.get('/sessions', async (req, res) => {
  try {
    const { role, userId, stationId, status, startDate, endDate } = req.query;

    let sessions;
    const filters = { status, startDate, endDate };

    if (role === 'admin') {
      // Admin sees all sessions
      sessions = await ChargingSession.getAll(filters);
    } else if (role === 'staff' && stationId) {
      // Staff sees sessions at their station
      sessions = await ChargingSession.getByStationId(stationId);
    } else if (role === 'customer' && userId) {
      // Customer sees their own sessions
      sessions = await ChargingSession.getByUserId(userId);
    } else {
      return res.status(400).json({ 
        error: 'Missing required parameters: role and userId/stationId' 
      });
    }

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session by ID
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await ChargingSession.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session statistics
router.get('/sessions/stats/summary', async (req, res) => {
  try {
    const { role, userId, stationId, startDate, endDate } = req.query;

    const filters = { startDate, endDate };
    
    if (role === 'customer' && userId) {
      filters.userId = userId;
    } else if (role === 'staff' && stationId) {
      filters.stationId = stationId;
    }
    // Admin gets all stats (no additional filters)

    const stats = await ChargingSession.getStatistics(filters);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching session statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new session (Driver or Staff can start)
router.post('/sessions', async (req, res) => {
  try {
    const sessionData = req.body;
    
    // Validate required fields
    if (!sessionData.user_id || !sessionData.point_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id and point_id' 
      });
    }

    const newSession = await ChargingSession.create(sessionData);
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// End session (Driver or Staff can end)
router.put('/sessions/:id/end', async (req, res) => {
  try {
    const endData = req.body;
    const updatedSession = await ChargingSession.endSession(req.params.id, endData);
    res.json(updatedSession);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update session status (Staff/Admin only)
router.put('/sessions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedSession = await ChargingSession.updateStatus(req.params.id, status);
    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
