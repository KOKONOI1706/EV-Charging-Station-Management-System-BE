/**
 * ===============================================================
 * PAYMENT CONTROLLER (BACKEND)
 * ===============================================================
 * Controller xử lý thanh toán qua MoMo và VNPay
 * 
 * Chức năng:
 * - 💳 MoMo Integration: Tạo payment URL, nhận IPN webhook, check status
 * - 💵 VNPay Integration: Tạo payment URL, nhận return callback
 * - 📄 Tạo invoice sau khi thanh toán thành công
 * - 🔄 Cập nhật payment status, session status
 * - ✅ Manual complete workaround (localhost testing)
 * 
 * MoMo API Docs: https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
 * 
 * MoMo Flow:
 * 1. Frontend gọi POST /payments/momo/create với { session_id, amount }
 * 2. Backend:
 *    - Tạo orderId = "ORDER_{sessionId}_{timestamp}"
 *    - Tạo payment record với status=Pending
 *    - Gọi MoMo API /v2/gateway/api/create
 *    - Nhận payUrl từ MoMo
 * 3. Frontend redirect user đến payUrl
 * 4. User thanh toán trên MoMo app/website
 * 5. MoMo gửi IPN webhook đến /payments/momo/ipn
 * 6. Backend verify signature, cập nhật payment + session + tạo invoice
 * 7. Frontend poll /payments/momo/status/:orderId để kiểm tra kết quả
 * 
 * Signature verification:
 * - MoMo gửi signature trong IPN request
 * - Backend tính signature từ raw data + secret key
 * - So sánh để verify tính hợp lệ
 * 
 * Environment variables:
 * - MOMO_PARTNER_CODE: Partner code từ MoMo
 * - MOMO_ACCESS_KEY: Access key
 * - MOMO_SECRET_KEY: Secret key để sign requests
 * - MOMO_ENDPOINT: Test hoặc production endpoint
 * - MOMO_REDIRECT_URL: URL redirect sau thanh toán
 * - MOMO_IPN_URL: URL nhận IPN webhook
 * 
 * Payment statuses:
 * - Pending: Chờ thanh toán
 * - Success: Thanh toán thành công
 * - Failed: Thanh toán thất bại
 * 
 * Invoice creation:
 * - Tự động tạo invoice sau khi payment success
 * - invoice.status = Paid
 * - invoice.total_amount = payment.amount
 * 
 * Dependencies:
 * - crypto: HMAC SHA256 signature
 * - https: Call MoMo API
 * - Supabase: Database operations
 */

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
  redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:3000/payment/callback",
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
    console.log('🔍 Looking for session:', session_id);
    const { data: session, error: sessionError } = await supabase
      .from('charging_sessions')
      .select(`
        *,
        charging_points (
          point_id,
          name,
          power_kw,
          stations (
            id,
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

    console.log('📊 Session query result:', {
      found: !!session,
      error: sessionError?.message,
      sessionData: session ? { id: session.session_id, status: session.status } : null
    });

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Charging session not found',
        details: sessionError?.message
      });
    }

    // Check if payment already exists
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('session_id', session_id)
      .in('status', ['Pending', 'Completed']);

    // If there's a completed payment, don't allow creating another one
    const completedPayment = existingPayments?.find(p => p.status === 'Completed');
    if (completedPayment) {
      console.log('❌ Payment already completed:', completedPayment.payment_id);
      return res.status(409).json({
        success: false,
        error: 'Payment already completed for this session',
        payment_id: completedPayment.payment_id,
        status: 'Completed'
      });
    }

    // If there's a pending payment, check if it's still valid (created within last 15 minutes)
    const pendingPayment = existingPayments?.find(p => p.status === 'Pending');
    if (pendingPayment) {
      const createdAt = new Date(pendingPayment.created_at);
      const now = new Date();
      const minutesElapsed = (now - createdAt) / (1000 * 60);
      
      // If payment is still valid (< 15 minutes old), return existing payment URL
      if (minutesElapsed < 15 && pendingPayment.payment_url) {
        console.log('✅ Returning existing payment URL (still valid):', pendingPayment.payment_id);
        return res.json({
          success: true,
          data: {
            payment_id: pendingPayment.payment_id,
            order_id: pendingPayment.order_id,
            amount: pendingPayment.amount,
            currency: pendingPayment.currency,
            payment_url: pendingPayment.payment_url,
            qrCodeUrl: pendingPayment.qr_code_url,
            expires_at: new Date(createdAt.getTime() + 15 * 60 * 1000).toISOString(),
            is_existing: true
          },
          message: 'Using existing payment session'
        });
      } else {
        // Payment expired, mark as failed and create new one
        console.log('⏰ Existing payment expired, creating new one');
        await supabase
          .from('payments')
          .update({ 
            status: 'Failed', 
            failure_reason: 'Payment timeout - expired after 15 minutes',
            updated_at: new Date().toISOString()
          })
          .eq('payment_id', pendingPayment.payment_id);
      }
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
      user_id: session.user_id,
      session_id: session_id,
      amount: amountInVND,
      currency: currency,
      payment_method: 'momo',
      status: 'Pending', // Match database enum: Pending, Completed, Failed
      order_id: orderId,
      momo_request_id: momoPayment.requestId,
      payment_url: momoPayment.payUrl,
      qr_code_url: momoPayment.qrCodeUrl,
      momo_response: momoPayment,
      date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    console.log('💾 Inserting payment record:', {
      user_id: paymentData.user_id,
      session_id: paymentData.session_id,
      amount: paymentData.amount,
      order_id: paymentData.order_id
    });

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Payment insert error:', paymentError);
      throw paymentError;
    }

    console.log('✅ Payment record created:', payment.payment_id);

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
    
    console.log('🔍 Checking payment status for orderId:', orderId);

    // First, get the payment without joins to ensure we find it
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId);

    console.log('📊 Payment query result:', {
      found: payments?.length > 0,
      count: payments?.length,
      error: error?.message
    });

    if (error || !payments || payments.length === 0) {
      console.log('❌ Payment not found:', { orderId, error: error?.message });
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        orderId: orderId
      });
    }

    const payment = payments[0];
    
    console.log('✅ Payment found:', {
      payment_id: payment.payment_id,
      status: payment.status,
      amount: payment.amount,
      session_id: payment.session_id
    });

    // Now get session details if session_id exists
    let sessionDetails = null;
    if (payment.session_id) {
      const { data: session } = await supabase
        .from('charging_sessions')
        .select(`
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
        `)
        .eq('session_id', payment.session_id)
        .maybeSingle();
      
      sessionDetails = session;
    }

    // Combine payment and session data
    const responseData = {
      ...payment,
      charging_sessions: sessionDetails
    };

    res.json({
      success: true,
      data: responseData
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
 * Manual complete payment (workaround for localhost IPN issue)
 */
export const manualCompletePayment = async (req, res) => {
  try {
    const { orderId, resultCode, amount, message } = req.body;

    console.log('📝 Manual payment completion request:', { orderId, resultCode });

    if (!orderId || !resultCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, resultCode'
      });
    }

    // Only allow success result codes
    if (resultCode !== '0') {
      return res.status(400).json({
        success: false,
        error: 'Can only manually complete successful payments (resultCode=0)'
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
        error: 'Payment not found'
      });
    }

    // Check if already completed
    if (payment.status === 'Completed') {
      console.log('ℹ️ Payment already completed');
      
      // Even if payment is completed, ensure session is also marked as completed
      if (payment.session_id) {
        const { data: sessionCheck } = await supabase
          .from('charging_sessions')
          .select('status')
          .eq('session_id', payment.session_id)
          .single();
        
        // Update session if it's still Active
        if (sessionCheck && sessionCheck.status === 'Active') {
          const { data: fixed, error: fixError } = await supabase
            .from('charging_sessions')
            .update({
              status: 'Completed'
            })
            .eq('session_id', payment.session_id)
            .select()
            .single();
          
          if (fixError) {
            console.error('❌ Failed to fix session status:', fixError);
          } else {
            console.log('✅ Session status fixed to Completed:', payment.session_id);
            console.log('Fixed session:', fixed);
          }
        } else {
          console.log('ℹ️ Session already completed or not found:', sessionCheck?.status);
        }
      }
      
      return res.json({
        success: true,
        message: 'Payment already completed',
        data: payment
      });
    }

    // Update payment to Completed
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'Completed',
        paid_at: new Date().toISOString()
      })
      .eq('payment_id', payment.payment_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update payment:', updateError);
      throw updateError;
    }

    console.log('✅ Payment manually completed:', payment.payment_id);

    // Update charging session with full completion data
    if (payment.session_id) {
      // Get current session to calculate final values
      const { data: currentSession, error: fetchError } = await supabase
        .from('charging_sessions')
        .select(`
          *,
          charging_points (
            power_kw,
            stations (
              price_per_kwh
            )
          ),
          vehicles (
            battery_capacity_kwh
          )
        `)
        .eq('session_id', payment.session_id)
        .single();

      if (fetchError || !currentSession) {
        console.error('❌ Failed to fetch session for completion:', fetchError);
      } else {
        // Calculate final values based on elapsed time
        const now = new Date();
        let startTimeStr = currentSession.start_time;
        if (typeof startTimeStr === 'string' && !startTimeStr.endsWith('Z') && !startTimeStr.includes('+')) {
          startTimeStr = startTimeStr + 'Z';
        }
        const startTime = new Date(startTimeStr);
        const elapsedMs = now - startTime;
        const elapsedHours = elapsedMs / (1000 * 60 * 60);

        const chargingPowerKw = currentSession.charging_points?.power_kw || 7;
        let energyConsumed = chargingPowerKw * elapsedHours;

        // ✅ Cap energy based on battery capacity and target percent
        const batteryCapacity = currentSession.vehicles?.battery_capacity_kwh || 100;
        const initialBatteryPercent = currentSession.initial_battery_percent || 0;
        const targetBatteryPercent = currentSession.target_battery_percent || 100;
        
        // Maximum energy that can be charged from initial to target
        const maxEnergyCanCharge = ((targetBatteryPercent - initialBatteryPercent) / 100) * batteryCapacity;
        
        // Cap energy - don't exceed what can actually be charged
        const cappedEnergy = Math.min(energyConsumed, maxEnergyCanCharge, 200);
        
        console.log('💡 Payment completion - Energy calculation:', {
          session_id: payment.session_id,
          elapsed_hours: elapsedHours.toFixed(4),
          raw_energy: energyConsumed.toFixed(2),
          battery_capacity: batteryCapacity,
          initial_percent: initialBatteryPercent,
          target_percent: targetBatteryPercent,
          max_energy_can_charge: maxEnergyCanCharge.toFixed(2),
          final_capped_energy: cappedEnergy.toFixed(2)
        });

        // Use capped energy for final calculations
        energyConsumed = cappedEnergy;

        // Calculate final meter reading
        const meterEnd = currentSession.meter_start + energyConsumed;

        // Calculate cost
        let pricePerKwh = currentSession.charging_points?.stations?.price_per_kwh || 5000;
        if (pricePerKwh < 10) {
          pricePerKwh = pricePerKwh * 24000; // Convert USD to VND
        }
        const totalCost = energyConsumed * pricePerKwh;

        const finalCost = payment.amount || Math.round(totalCost);
        
        console.log('💰 Cost comparison:', {
          payment_amount: payment.amount,
          calculated_cost: Math.round(totalCost),
          using_amount: finalCost
        });

        const { data: updatedSession, error: sessionError } = await supabase
          .from('charging_sessions')
          .update({
            status: 'Completed',
            end_time: now.toISOString(),
            meter_end: parseFloat(meterEnd.toFixed(2)),
            energy_consumed_kwh: parseFloat(energyConsumed.toFixed(2)),
            cost: finalCost 
          })
          .eq('session_id', payment.session_id)
          .select()
          .single();
        
        if (sessionError) {
          console.error('❌ Failed to update session status:', sessionError);
          console.error('Session ID:', payment.session_id);
        } else {
          console.log('✅ Charging session completed with full data:', {
            session_id: updatedSession.session_id,
            energy_consumed_kwh: updatedSession.energy_consumed_kwh,
            cost: updatedSession.cost,
            meter_end: updatedSession.meter_end
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Payment manually completed successfully',
      data: updatedPayment
    });

  } catch (error) {
    console.error('Error manually completing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete payment',
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
  getUserPayments,
  manualCompletePayment
};