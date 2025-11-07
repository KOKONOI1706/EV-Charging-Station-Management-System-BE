import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import supabase from '../supabase/client.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', async (req, res) => {
  try {
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: stationsCount } = await supabase.from('stations').select('*', { count: 'exact', head: true });
    const { count: bookingsCount } = await supabase.from('reservations').select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: {
        totalUsers: usersCount || 0,
        totalStations: stationsCount || 0,
        totalBookings: bookingsCount || 0,
        adminInfo: req.user
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['admin', 'staff', 'user'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });

    const { data, error } = await supabase.from('users').update({ role }).eq('id', userId).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
