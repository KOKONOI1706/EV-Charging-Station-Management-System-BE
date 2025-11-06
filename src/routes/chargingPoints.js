import express from 'express';
import supabase from '../supabase/client.js';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/charging-points - Get all charging points
router.get('/', async (req, res) => {
  try {
    const { station_id, status } = req.query;

    let query = supabase
      .from('charging_points')
      .select(`
        *,
        stations (
          id,
          name,
          address
        )
      `)
      .order('point_id', { ascending: true });

    if (station_id) {
      query = query.eq('station_id', station_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: chargingPoints, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: chargingPoints,
      total: chargingPoints.length
    });
  } catch (error) {
    console.error('Error fetching charging points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch charging points',
      message: error.message
    });
  }
});

// GET /api/charging-points/:id - Get charging point by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: chargingPoint, error } = await supabase
      .from('charging_points')
      .select(`
        *,
        stations (
          id,
          name,
          address,
          city,
          lat,
          lng
        )
      `)
      .eq('point_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Charging point not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: chargingPoint
    });
  } catch (error) {
    console.error('Error fetching charging point:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch charging point',
      message: error.message
    });
  }
});

// PUT /api/charging-points/:id/status - Update charging point status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Available', 'In Use', 'Reserved', 'Maintenance', 'Offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Update last_seen_at for active statuses
    if (['Available', 'In Use', 'Reserved'].includes(status)) {
      updateData.last_seen_at = new Date().toISOString();
    }

    const { data: chargingPoint, error } = await supabase
      .from('charging_points')
      .update(updateData)
      .eq('point_id', id)
      .select(`
        *,
        stations (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: chargingPoint,
      message: `Charging point status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating charging point status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update charging point status',
      message: error.message
    });
  }
});

// POST /api/charging-points/:id/reserve - Reserve a charging point (authenticated users)
router.post('/:id/reserve', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // use authenticated user id rather than trusting client-provided user_id
    const { reservation_id } = req.body;
    const user_id = req.user?.id || req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Check if charging point exists and is available
    const { data: chargingPoint, error: fetchError } = await supabase
      .from('charging_points')
      .select('*, stations(*)')
      .eq('point_id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        error: 'Charging point not found'
      });
    }

    if (chargingPoint.status !== 'Available') {
      return res.status(400).json({
        success: false,
        error: `Charging point is not available. Current status: ${chargingPoint.status}`
      });
    }

    // Update status to Reserved
    const { data: updatedPoint, error: updateError } = await supabase
      .from('charging_points')
      .update({
        status: 'Reserved',
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .eq('point_id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedPoint,
      message: 'Charging point reserved successfully'
    });
  } catch (error) {
    console.error('Error reserving charging point:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reserve charging point',
      message: error.message
    });
  }
});

// POST /api/charging-points/:id/release - Release a reserved charging point (authenticated users)
router.post('/:id/release', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Update status to Available
    const { data: chargingPoint, error } = await supabase
      .from('charging_points')
      .update({
        status: 'Available',
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .eq('point_id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: chargingPoint,
      message: 'Charging point released successfully'
    });
  } catch (error) {
    console.error('Error releasing charging point:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to release charging point',
      message: error.message
    });
  }
});

export default router;
