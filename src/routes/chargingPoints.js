import express from 'express';
import supabase from '../supabase/client.js';

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
        ),
        connector_types (
          connector_type_id,
          code,
          name
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
        ),
        connector_types (
          connector_type_id,
          code,
          name
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

// PUT /api/charging-points/:id/status - Update charging point status
router.put('/:id/status', async (req, res) => {
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

// POST /api/charging-points/:id/reserve - Reserve a charging point
router.post('/:id/reserve', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, reservation_id } = req.body;

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

// POST /api/charging-points/:id/release - Release a reserved charging point
router.post('/:id/release', async (req, res) => {
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

// POST /api/charging-points - Create a new charging point
router.post('/', async (req, res) => {
  try {
    const {
      station_id,
      name,
      power_kw,
      connector_type_id,
      status = 'Available'
    } = req.body;

    // Validation
    if (!station_id || !name || !power_kw || !connector_type_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: station_id, name, power_kw, connector_type_id'
      });
    }

    const chargingPointData = {
      station_id,
      name,
      power_kw,
      connector_type_id,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    };

    const { data: newPoint, error } = await supabase
      .from('charging_points')
      .insert([chargingPointData])
      .select(`
        *,
        connector_types (
          connector_type_id,
          code,
          name
        ),
        stations (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: newPoint,
      message: 'Charging point created successfully'
    });
  } catch (error) {
    console.error('Error creating charging point:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create charging point',
      message: error.message
    });
  }
});

// PUT /api/charging-points/:id - Update a charging point
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      power_kw,
      connector_type_id,
      status,
      pos_x,
      pos_y
    } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (power_kw !== undefined) updateData.power_kw = power_kw;
    if (connector_type_id !== undefined) updateData.connector_type_id = connector_type_id;
    if (pos_x !== undefined) updateData.pos_x = pos_x;
    if (pos_y !== undefined) updateData.pos_y = pos_y;
    if (status !== undefined) {
      const validStatuses = ['Available', 'In Use', 'Reserved', 'Maintenance', 'Offline'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      updateData.status = status;
    }

    const { data: updatedPoint, error } = await supabase
      .from('charging_points')
      .update(updateData)
      .eq('point_id', id)
      .select(`
        *,
        connector_types (
          connector_type_id,
          code,
          name
        ),
        stations (
          id,
          name
        )
      `)
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
      data: updatedPoint,
      message: 'Charging point updated successfully'
    });
  } catch (error) {
    console.error('Error updating charging point:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update charging point',
      message: error.message
    });
  }
});

// DELETE /api/charging-points/:id - Delete a charging point
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('charging_points')
      .delete()
      .eq('point_id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Charging point deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting charging point:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete charging point',
      message: error.message
    });
  }
});

// GET /api/charging-points/connector-types - Get all connector types
router.get('/connector-types/list', async (req, res) => {
  try {
    const { data: connectorTypes, error } = await supabase
      .from('connector_types')
      .select('*')
      .order('connector_type_id', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: connectorTypes
    });
  } catch (error) {
    console.error('Error fetching connector types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch connector types',
      message: error.message
    });
  }
});

export default router;
