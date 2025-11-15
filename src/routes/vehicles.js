import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// GET /api/vehicles/meta/connector-types - Get all connector types
router.get('/meta/connector-types', async (req, res) => {
  try {
    const { data: connectorTypes, error } = await supabaseAdmin
      .from('connector_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: connectorTypes || []
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

// GET /api/vehicles - Get all vehicles for a user
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    const { data: vehicles, error } = await supabaseAdmin
      .from('vehicles')
      .select(`
        *,
        connector_types (
          connector_type_id,
          code,
          name,
          max_power_kw
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: vehicles || [],
      total: vehicles?.length || 0
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles',
      message: error.message
    });
  }
});

// GET /api/vehicles/:id - Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .select(`
        *,
        connector_types (
          connector_type_id,
          code,
          name,
          max_power_kw
        )
      `)
      .eq('vehicle_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle',
      message: error.message
    });
  }
});

// POST /api/vehicles - Create a new vehicle
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      plate_number,
      make,
      model,
      year,
      color,
      battery_capacity_kwh,
      connector_type_id
    } = req.body;

    // Validate required fields
    if (!user_id || !plate_number) {
      return res.status(400).json({
        success: false,
        error: 'user_id and plate_number are required'
      });
    }

    // Check if plate number already exists for this user
    const { data: existingVehicle, error: checkError } = await supabaseAdmin
      .from('vehicles')
      .select('vehicle_id')
      .eq('plate_number', plate_number)
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle with this plate number already exists'
      });
    }

    const vehicleData = {
      user_id,
      plate_number,
      make: make || null,
      model: model || null,
      year: year || null,
      color: color || null,
      battery_capacity_kwh: battery_capacity_kwh || null,
      connector_type_id: connector_type_id || null,
      created_at: new Date().toISOString()
    };

    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .insert([vehicleData])
      .select(`
        *,
        connector_types (
          connector_type_id,
          code,
          name,
          max_power_kw
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle added successfully'
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vehicle',
      message: error.message
    });
  }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plate_number,
      make,
      model,
      year,
      color,
      battery_capacity_kwh,
      connector_type_id
    } = req.body;

    // Build update object (only include provided fields)
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (plate_number !== undefined) updateData.plate_number = plate_number;
    if (make !== undefined) updateData.make = make;
    if (model !== undefined) updateData.model = model;
    if (year !== undefined) updateData.year = year;
    if (color !== undefined) updateData.color = color;
    if (battery_capacity_kwh !== undefined) updateData.battery_capacity_kwh = battery_capacity_kwh;
    if (connector_type_id !== undefined) updateData.connector_type_id = connector_type_id;

    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .update(updateData)
      .eq('vehicle_id', id)
      .select(`
        *,
        connector_types (
          connector_type_id,
          code,
          name,
          max_power_kw
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: vehicle,
      message: 'Vehicle updated successfully'
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle',
      message: error.message
    });
  }
});

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vehicle is used in any active charging sessions
    const { data: activeSessions, error: sessionError } = await supabaseAdmin
      .from('charging_sessions')
      .select('session_id')
      .eq('vehicle_id', id)
      .eq('status', 'Active')
      .limit(1);

    if (sessionError) {
      throw sessionError;
    }

    if (activeSessions && activeSessions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete vehicle with active charging sessions'
      });
    }

    const { error } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('vehicle_id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vehicle',
      message: error.message
    });
  }
});

export default router;

