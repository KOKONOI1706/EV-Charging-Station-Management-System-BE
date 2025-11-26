/**
 * ===============================================================
 * USER STATIONS ROUTES (BACKEND)
 * ===============================================================
 * Express routes quản lý assignment của Staff đến Stations
 * 
 * Endpoints:
 * - GET /api/user-stations/:userId - Lấy station được assign cho user
 * - PUT /api/user-stations/:userId - Cập nhật station assignment
 * - GET /api/user-stations/staff/:stationId - Lấy danh sách staff của station
 * 
 * Use cases:
 * 1. Staff login → Gọi getUserStation(staffId) → Hiển thị dashboard của station đó
 * 2. Admin assign staff → Gọi updateUserStation(staffId, stationId)
 * 3. Admin xem staff list → Gọi getStationStaff(stationId)
 * 
 * Database:
 * - Table: users
 * - Field: station_id (UUID, nullable)
 * - Relation: users.station_id → stations.id
 * 
 * GET /api/user-stations/:userId:
 * - Query: users table join stations (LEFT JOIN)
 * - Select: user info + station info (null nếu chưa assign)
 * - Return: { userId, name, email, roleId, stationId, station: {...} }
 * 
 * PUT /api/user-stations/:userId:
 * - Body: { stationId: "uuid" hoặc null }
 * - Validate: stationId tồn tại trong stations table
 * - Update: users.station_id = stationId
 * - Return: Updated user với station info
 * 
 * GET /api/user-stations/staff/:stationId:
 * - Query: users WHERE station_id = stationId AND role_id = 2 (staff)
 * - Order by: name ASC
 * - Return: { stationId, staffCount, staff: [...] }
 * 
 * Assignment flow:
 * 1. Admin vào User Management
 * 2. Chọn staff user
 * 3. Click "Assign to Station"
 * 4. Chọn station từ dropdown
 * 5. Frontend gọi PUT /api/user-stations/:userId với { stationId }
 * 6. Backend update users.station_id
 * 7. Staff login lại → Chỉ thấy data của station đó
 * 
 * Unassign:
 * - Gọi PUT với { stationId: null }
 * - users.station_id = null
 * - Staff không còn bị limit theo station
 * 
 * Dependencies:
 * - Supabase Admin: Query users, stations
 */

import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/user-stations/:userId
 * Get the assigned station for a user (staff member)
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[User Stations] Getting station for user ${userId}`);

    // Get user with their assigned station
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        user_id,
        name,
        email,
        role_id,
        station_id,
        stations:station_id (
          id,
          name,
          address,
          latitude,
          longitude,
          total_spots,
          available_spots
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[User Stations] Error fetching user station:', error);
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Return user with their station info
    res.json({
      success: true,
      data: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        roleId: user.role_id,
        stationId: user.station_id,
        station: user.stations // This will be null if user has no assigned station
      }
    });

  } catch (error) {
    console.error('[User Stations] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/user-stations/:userId
 * Update the assigned station for a user
 * Body: { stationId: "uuid" }
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { stationId } = req.body;

    console.log(`[User Stations] Updating station for user ${userId} to ${stationId}`);

    // Validate stationId if provided (null is allowed to unassign)
    if (stationId) {
      const { data: station, error: stationError } = await supabaseAdmin
        .from('stations')
        .select('id')
        .eq('id', stationId)
        .single();

      if (stationError || !station) {
        return res.status(400).json({
          success: false,
          error: 'Invalid station ID'
        });
      }
    }

    // Update user's station_id
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ station_id: stationId || null })
      .eq('user_id', userId)
      .select(`
        user_id,
        name,
        email,
        role_id,
        station_id,
        stations:station_id (
          id,
          name,
          address
        )
      `)
      .single();

    if (error) {
      console.error('[User Stations] Error updating user station:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update user station'
      });
    }

    console.log(`[User Stations] Successfully updated user ${userId} station to ${stationId}`);

    res.json({
      success: true,
      message: 'Station assignment updated successfully',
      data: {
        userId: data.user_id,
        name: data.name,
        stationId: data.station_id,
        station: data.stations
      }
    });

  } catch (error) {
    console.error('[User Stations] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/user-stations/staff/:stationId
 * Get all staff members assigned to a specific station
 */
router.get('/staff/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;

    console.log(`[User Stations] Getting staff for station ${stationId}`);

    // Get all staff members (role_id = 2 for staff) assigned to this station
    const { data: staff, error } = await supabaseAdmin
      .from('users')
      .select(`
        user_id,
        name,
        email,
        role_id,
        station_id,
        created_at
      `)
      .eq('station_id', stationId)
      .eq('role_id', 2) // Assuming role_id 2 is staff
      .order('name', { ascending: true });

    if (error) {
      console.error('[User Stations] Error fetching station staff:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch station staff'
      });
    }

    res.json({
      success: true,
      data: {
        stationId,
        staffCount: staff.length,
        staff
      }
    });

  } catch (error) {
    console.error('[User Stations] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
