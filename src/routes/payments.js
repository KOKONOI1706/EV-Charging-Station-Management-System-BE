import express from 'express';
import supabase from '../supabase/client.js';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();

// ============ MoMo Payment Routes ============

// POST /api/payments/momo/create - Create MoMo payment session
router.post('/momo/create', paymentController.createPaymentSession);

// POST /api/payments/momo/ipn - MoMo IPN callback (webhook)
router.post('/momo/ipn', paymentController.handleMoMoIPN);

// GET /api/payments/momo/status/:orderId - Check MoMo payment status
router.get('/momo/status/:orderId', paymentController.checkPaymentStatus);

// GET /api/payments/user/:userId - Get user's payment history
router.get('/user/:userId', paymentController.getUserPayments);

// ============ Legacy Payment Routes (Keep for backward compatibility) ============

// POST /api/payments/create-session - Create payment session
router.post('/create-session', async (req, res) => {
  try {
    const {
      reservation_id,
      amount,
      currency = 'VND',
      payment_method = 'stripe',
      return_url,
      cancel_url
    } = req.body;

    // Validate required fields
    if (!reservation_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reservation_id, amount'
      });
    }

    // Get reservation details
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        stations (
          id,
          name,
          address
        )
      `)
      .eq('id', reservation_id)
      .single();

    if (reservationError) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservation_id)
      .eq('status', 'pending')
      .single();

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        error: 'Payment session already exists for this reservation',
        payment_id: existingPayment.id
      });
    }

    // Create payment record
    const paymentData = {
      reservation_id,
      amount: parseFloat(amount),
      currency,
      payment_method,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // Simulate payment session creation (replace with actual payment gateway integration)
    const paymentSession = {
      session_id: `session_${payment.id}_${Date.now()}`,
      payment_url: `https://checkout.stripe.com/pay/${payment.id}`,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      payment_id: payment.id
    };

    // Update payment with session info
    await supabase
      .from('payments')
      .update({
        session_id: paymentSession.session_id,
        session_data: paymentSession
      })
      .eq('id', payment.id);

    res.json({
      success: true,
      data: {
        payment,
        session: paymentSession
      },
      message: 'Payment session created successfully'
    });
  } catch (error) {
    console.error('Error creating payment session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment session',
      message: error.message
    });
  }
});

// POST /api/payments/verify - Verify payment status
router.post('/verify', async (req, res) => {
  try {
    const { payment_id, session_id } = req.body;

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: 'payment_id is required'
      });
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        reservations (
          id,
          user_id,
          station_id,
          status
        )
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Simulate payment verification (replace with actual payment gateway verification)
    const isPaymentSuccessful = Math.random() > 0.1; // 90% success rate for simulation

    let updateData = {
      updated_at: new Date().toISOString()
    };

    if (isPaymentSuccessful) {
      updateData.status = 'completed';
      updateData.paid_at = new Date().toISOString();
      updateData.transaction_id = `txn_${payment_id}_${Date.now()}`;
    } else {
      updateData.status = 'failed';
      updateData.failure_reason = 'Payment declined by bank';
    }

    // Update payment status
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // If payment successful, confirm the reservation
    if (isPaymentSuccessful) {
      await supabase
        .from('reservations')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.reservations.id);
    }

    res.json({
      success: true,
      data: updatedPayment,
      message: isPaymentSuccessful ? 'Payment completed successfully' : 'Payment failed'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});

// GET /api/payments/:id - Get payment details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        reservations (
          id,
          user_id,
          station_id,
          start_time,
          end_time,
          status,
          stations (
            id,
            name,
            address,
            city
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment',
      message: error.message
    });
  }
});

// GET /api/payments/reservation/:reservationId - Get payments for reservation
router.get('/reservation/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: payments,
      total: payments.length
    });
  } catch (error) {
    console.error('Error fetching reservation payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments',
      message: error.message
    });
  }
});

// POST /api/payments/refund - Process refund
router.post('/refund', async (req, res) => {
  try {
    const { payment_id, amount, reason = 'Customer request' } = req.body;

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: 'payment_id is required'
      });
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (paymentError) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Can only refund completed payments'
      });
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount cannot exceed original payment amount'
      });
    }

    // Create refund record
    const refundData = {
      payment_id,
      amount: refundAmount,
      reason,
      status: 'processing',
      created_at: new Date().toISOString()
    };

    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert([refundData])
      .select()
      .single();

    if (refundError) {
      throw refundError;
    }

    // Simulate refund processing (replace with actual payment gateway refund)
    const isRefundSuccessful = Math.random() > 0.05; // 95% success rate

    let updateData = {
      status: isRefundSuccessful ? 'completed' : 'failed',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isRefundSuccessful) {
      updateData.refund_transaction_id = `rfnd_${payment_id}_${Date.now()}`;
    } else {
      updateData.failure_reason = 'Refund processing failed';
    }

    const { data: updatedRefund, error: updateRefundError } = await supabase
      .from('refunds')
      .update(updateData)
      .eq('id', refund.id)
      .select()
      .single();

    if (updateRefundError) {
      throw updateRefundError;
    }

    // Update payment status if full refund
    if (isRefundSuccessful && refundAmount === payment.amount) {
      await supabase
        .from('payments')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment_id);
    }

    res.json({
      success: true,
      data: updatedRefund,
      message: isRefundSuccessful ? 'Refund processed successfully' : 'Refund processing failed'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
      message: error.message
    });
  }
});

// GET /api/payments/user/:userId - Get user's payment history
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        reservations!inner (
          id,
          user_id,
          station_id,
          start_time,
          end_time,
          stations (
            id,
            name,
            address,
            city
          )
        )
      `)
      .eq('reservations.user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: payments,
      total: payments.length
    });
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history',
      message: error.message
    });
  }
});

export default router;