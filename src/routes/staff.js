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
 * Bắt đầu phiên sạc cho một user
 * Body: { userId, vehicleId, stationId, pointId? (optional), meter_start? (optional) }
 * Output: thông tin phiên sạc mới, thời gian bắt đầu
 */
router.post('/sessions/start', async (req, res) => {
  try {
    const { userId, vehicleId, stationId, pointId, meter_start } = req.body;
    
    if (!userId || !vehicleId || !stationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, vehicleId, stationId' 
      });
    }

    const session = await startSession({ userId, vehicleId, stationId, pointId, meter_start });
    
    res.status(201).json({ 
      success: true, 
      data: session, 
      message: 'Charging session started successfully',
      startTime: session.start_time
    });
  } catch (err) {
    console.error('Error starting session (staff):', err);
    const status = err && err.status ? err.status : 500;
    res.status(status).json({ 
      success: false, 
      error: err.message,
      ...(err.data && { data: err.data })
    });
  }
});


/**
 * POST /api/staff/sessions/stop
 * Dừng phiên sạc cho một user
 * Body: { sessionId, meter_end? (optional) }
 * Xử lý: 
 * - Kiểm tra user có hóa đơn chưa thanh toán (chỉ được dừng nếu không còn nợ)
 * - Cập nhật trạng thái thành "đã dừng"
 * - Tính phí đậu xe nếu vượt quá 10 phút
 * Output: thông tin phí sạc, phí đậu (nếu có)
 */
router.post('/sessions/stop', async (req, res) => {
  try {
    const { sessionId, meter_end } = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'sessionId is required' 
      });
    }

    const result = await stopSession(sessionId, meter_end);
    
    res.json({ 
      success: true, 
      data: result.updatedSession,
      chargingCost: result.chargingCost,
      parkingFee: result.parkingFee,
      totalCost: result.totalCost,
      durationMinutes: result.durationMinutes,
      energyConsumed: result.energyConsumed,
      message: 'Charging session stopped successfully'
    });
  } catch (err) {
    console.error('Error stopping session (staff):', err);
    const status = err && err.status ? err.status : 500;
    res.status(status).json({ 
      success: false, 
      error: err.message,
      ...(err.data && { data: err.data })
    });
  }
});


/**
 * GET /api/staff/invoices/unpaid/:userId
 * Kiểm tra hóa đơn chưa thanh toán của user
 * Input: userId (URL parameter)
 * Output: danh sách hóa đơn chưa thanh toán hoặc trạng thái "còn nợ" / "đã thanh toán"
 */
router.get('/invoices/unpaid/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId is required' 
      });
    }

    const { unpaidInvoices, owes, message } = await getUnpaidInvoicesForUser(userId);
    
    res.json({ 
      success: true, 
      data: unpaidInvoices, 
      owes,
      status: owes ? 'còn nợ' : 'đã thanh toán',
      message: message || (owes ? 'User has outstanding invoices' : 'No outstanding invoices')
    });
  } catch (err) {
    console.error('Error fetching unpaid invoices (staff):', err);
    const status = err && err.status ? err.status : 500;
    res.status(status).json({ 
      success: false, 
      error: err.message 
    });
  }
});

export default router;
