import express from 'express';
import { authenticateToken, requireAdminOrStaff } from '../middleware/auth.js';
import { startSession, stopSession, getUnpaidInvoicesForUser } from '../services/staffService.js';

const router = express.Router();

// Protect all staff endpoints: admin or staff only
router.use(authenticateToken);
router.use(requireAdminOrStaff);

// Staff service handles DB interactions and parking fee configuration

/**
 * POST /api/staff/sessions/start
 * Body: { userId, vehicleId, stationId, pointId?, meter_start? }
 */
router.post('/sessions/start', async (req, res) => {
  try {
    const { userId, vehicleId, stationId, pointId, meter_start } = req.body;
    const session = await startSession({ userId, vehicleId, stationId, pointId, meter_start });
    res.status(201).json({ success: true, data: session, message: 'Session started' });
  } catch (err) {
    console.error('Error starting session (staff):', err);
    const status = err && err.status ? err.status : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});


/**
 * POST /api/staff/sessions/stop
 * Body: { sessionId, meter_end? }
 * Staff may only stop session if user has no unpaid invoices
 */
router.post('/sessions/stop', async (req, res) => {
  try {
    const { sessionId, meter_end } = req.body;

    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId is required' });

    const result = await stopSession(sessionId, meter_end);
    res.json({ success: true, data: result.updatedSession, chargingCost: result.chargingCost, parkingFee: result.parkingFee, durationMinutes: result.durationMinutes });
  } catch (err) {
    console.error('Error stopping session (staff):', err);
    const status = err && err.status ? err.status : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});


/**
 * GET /api/staff/invoices/unpaid/:userId
 * List unpaid invoices for a user
 */
router.get('/invoices/unpaid/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { unpaidPayments, owes } = await getUnpaidInvoicesForUser(userId);
    res.json({ success: true, data: unpaidPayments, owes, message: owes ? 'User has outstanding invoices' : 'No outstanding invoices' });
  } catch (err) {
    console.error('Error fetching unpaid invoices (staff):', err);
    const status = err && err.status ? err.status : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

export default router;
