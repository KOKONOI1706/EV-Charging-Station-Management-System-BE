import crypto from 'crypto';
import https from 'https';
import supabase from '../supabase/client.js';

// MoMo Configuration
// Docs: https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
  accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
  secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn",
  redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:3001/payment/callback",
  ipnUrl: process.env.MOMO_IPN_URL || "http://localhost:5000/api/payments/momo/ipn",
  requestType: "captureWallet"
};

/**
 * Create MoMo payment URL
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} - Payment URL and transaction info
 */
export const createMoMoPayment = async (paymentData) => {
  const {
    orderId,
    amount,
    orderInfo,
    extraData = "",
    lang = 'vi'
  } = paymentData;

  try {
    const requestId = MOMO_CONFIG.partnerCode + new Date().getTime();
    
    // Create raw signature string
    const rawSignature = 
      `accessKey=${MOMO_CONFIG.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${MOMO_CONFIG.ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${MOMO_CONFIG.partnerCode}` +
      `&redirectUrl=${MOMO_CONFIG.redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${MOMO_CONFIG.requestType}`;

    // Generate HMAC SHA256 signature
    const signature = crypto
      .createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Prepare request body
    const requestBody = JSON.stringify({
      partnerCode: MOMO_CONFIG.partnerCode,
      accessKey: MOMO_CONFIG.accessKey,
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: MOMO_CONFIG.redirectUrl,
      ipnUrl: MOMO_CONFIG.ipnUrl,
      extraData: extraData,
      requestType: MOMO_CONFIG.requestType,
      signature: signature,
      lang: lang
    });

    // Make request to MoMo
    const momoResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200 && response.resultCode === 0) {
              resolve(response);
            } else {
              reject(new Error(response.message || 'MoMo payment creation failed'));
            }
          } catch (error) {
            reject(new Error('Failed to parse MoMo response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });

    return {
      success: true,
      payUrl: momoResponse.payUrl,
      deeplink: momoResponse.deeplink,
      qrCodeUrl: momoResponse.qrCodeUrl,
      orderId: orderId,
      requestId: requestId,
      signature: signature
    };

  } catch (error) {
    console.error('MoMo payment creation error:', error);
    throw error;
  }
};

/**
 * Create payment session with MoMo
 */
export const createPaymentSession = async (req, res) => {
  try {
    const {
      session_id,
      amount,
      currency = 'VND',
      description = 'EV Charging Session Payment'
    } = req.body;

    // Validate required fields
    if (!session_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: session_id, amount'
      });
    }

    // Get charging session details
    const { data: session, error: sessionError } = await supabase
      .from('charging_sessions')
      .select(`
        *,
        charging_points (
          point_id,
          name,
          power_kw,
          stations (
            station_id,
            name,
            address
          )
        ),
        users (
          user_id,
          name,
          email
        )
      `)
      .eq('session_id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Charging session not found'
      });
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('session_id', session_id)
      .eq('status', 'pending')
      .single();

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        error: 'Payment already exists for this session',
        payment_id: existingPayment.payment_id
      });
    }

    // Generate unique order ID
    const orderId = `EV_${session_id}_${Date.now()}`;
    const orderInfo = `${description} - Station: ${session.charging_points?.stations?.name || 'N/A'}`;
    const amountInVND = Math.round(parseFloat(amount));

    // Create MoMo payment URL
    const momoPayment = await createMoMoPayment({
      orderId: orderId,
      amount: amountInVND.toString(),
      orderInfo: orderInfo,
      extraData: JSON.stringify({
        session_id: session_id,
        user_id: session.user_id,
        station_id: session.charging_points?.stations?.station_id
      })
    });

    // Create payment record in database
    const paymentData = {
      session_id: session_id,
      amount: amountInVND,
      currency: currency,
      payment_method: 'momo',
      status: 'pending',
      order_id: orderId,
      momo_request_id: momoPayment.requestId,
      payment_url: momoPayment.payUrl,
      date: new Date().toISOString()
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    res.json({
      success: true,
      data: {
        payment_id: payment.payment_id,
        order_id: orderId,
        amount: amountInVND,
        currency: currency,
        payment_url: momoPayment.payUrl,
        deeplink: momoPayment.deeplink,
        qrCodeUrl: momoPayment.qrCodeUrl,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
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
};

/**
 * Handle MoMo IPN (Instant Payment Notification)
 */
export const handleMoMoIPN = async (req, res) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = req.body;

    console.log('📩 MoMo IPN received:', {
      orderId,
      resultCode,
      message,
      transId
    });

    // Verify signature
    const rawSignature = 
      `accessKey=${MOMO_CONFIG.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const validSignature = crypto
      .createHmac('sha256', MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest('hex');

    if (signature !== validSignature) {
      console.error('❌ Invalid MoMo signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Find payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (paymentError || !payment) {
      console.error('❌ Payment not found:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update payment status based on result code
    let updateData = {
      momo_trans_id: transId,
      momo_response_time: responseTime,
      updated_at: new Date().toISOString()
    };

    if (resultCode === 0) {
      // Payment successful
      updateData.status = 'Completed';
      updateData.paid_at = new Date().toISOString();
      
      console.log('✅ Payment successful:', orderId);
    } else {
      // Payment failed
      updateData.status = 'Failed';
      updateData.failure_reason = message;
      
      console.log('❌ Payment failed:', orderId, message);
    }

    // Update payment in database
    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('payment_id', payment.payment_id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
    }

    // If payment successful, update charging session
    if (resultCode === 0 && payment.session_id) {
      await supabase
        .from('charging_sessions')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', payment.session_id);
    }

    // Respond to MoMo
    res.status(200).json({
      success: true,
      message: 'IPN processed successfully'
    });

  } catch (error) {
    console.error('Error processing MoMo IPN:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Check MoMo payment status
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        charging_sessions (
          session_id,
          user_id,
          point_id,
          status,
          charging_points (
            name,
            stations (
              name,
              address
            )
          )
        )
      `)
      .eq('order_id', orderId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status',
      message: error.message
    });
  }
};

/**
 * Get payment history for user
 */
export const getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        charging_sessions (
          session_id,
          start_time,
          end_time,
          energy_consumed_kwh,
          charging_points (
            name,
            power_kw,
            stations (
              name,
              address,
              city
            )
          )
        )
      `)
      .eq('charging_sessions.user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

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
};

export default {
  createMoMoPayment,
  createPaymentSession,
  handleMoMoIPN,
  checkPaymentStatus,
  getUserPayments
};