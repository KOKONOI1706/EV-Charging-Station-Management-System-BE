import { supabaseAdmin } from '../config/supabase.js';

const PARKING_FEE_PER_MINUTE = parseFloat(process.env.PARKING_FEE_PER_MINUTE || '0.5');
const PARKING_GRACE_MINUTES = parseInt(process.env.PARKING_GRACE_MINUTES || '10', 10);

/**
 * Bắt đầu phiên sạc cho một user
 * Input: userId, vehicleId, stationId, pointId (optional), meter_start (optional)
 * Output: thông tin phiên sạc mới, thời gian bắt đầu
 */
async function startSession({ userId, vehicleId, stationId, pointId = null, meter_start = null }) {
  if (!userId || !vehicleId || !stationId) {
    const err = new Error('Missing required fields: userId, vehicleId, stationId');
    err.status = 400;
    throw err;
  }

  // Nếu không có pointId, tìm một charging point available từ station
  let selectedPointId = pointId;
  
  if (!selectedPointId) {
    // Tìm charging point available từ station
    const stationIdInt = parseInt(stationId);
    const { data: availablePoints, error: pointsError } = await supabaseAdmin
      .from('charging_points')
      .select('point_id, name, status')
      .eq('station_id', stationIdInt)
      .in('status', ['Available', 'Reserved'])
      .limit(1)
      .maybeSingle();

    if (pointsError) {
      console.error('Error finding available charging point:', pointsError);
      const err = new Error(`Error finding available charging point: ${pointsError.message}`);
      err.status = 500;
      throw err;
    }

    if (!availablePoints) {
      const err = new Error(`No available charging point found at station ${stationIdInt}`);
      err.status = 404;
      throw err;
    }

    selectedPointId = availablePoints.point_id;
  } else {
    // Kiểm tra pointId có thuộc stationId không
    const { data: point, error: pointError } = await supabaseAdmin
      .from('charging_points')
      .select('point_id, station_id, status')
      .eq('point_id', selectedPointId)
      .single();

    if (pointError) {
      console.error('Error fetching charging point:', pointError);
      const err = new Error(`Charging point not found: ${pointError.message}`);
      err.status = 404;
      throw err;
    }

    if (!point) {
      const err = new Error('Charging point not found');
      err.status = 404;
      throw err;
    }

    // Đảm bảo so sánh đúng kiểu dữ liệu
    const pointStationId = parseInt(point.station_id);
    const requestedStationId = parseInt(stationId);
    
    if (pointStationId !== requestedStationId) {
      const err = new Error(`Charging point does not belong to the specified station. Point belongs to station ${pointStationId}, but requested station ${requestedStationId}`);
      err.status = 400;
      throw err;
    }

    if (!['Available', 'Reserved'].includes(point.status)) {
      const err = new Error(`Charging point is not available (status: ${point.status})`);
      err.status = 400;
      throw err;
    }
  }

  // Kiểm tra user có session đang active không
  const { data: activeSession } = await supabaseAdmin
    .from('charging_sessions')
    .select('session_id')
    .eq('user_id', userId)
    .eq('status', 'Active')
    .maybeSingle();

  if (activeSession) {
    const err = new Error('User already has an active charging session');
    err.status = 400;
    throw err;
  }

  // Kiểm tra point có đang được sử dụng không
  const { data: pointInUse } = await supabaseAdmin
    .from('charging_sessions')
    .select('session_id')
    .eq('point_id', selectedPointId)
    .eq('status', 'Active')
    .maybeSingle();

  if (pointInUse) {
    const err = new Error('Charging point is currently in use');
    err.status = 400;
    throw err;
  }

  // Tạo session mới với trạng thái "đang sạc" (Active)
  const startTime = new Date();
  const sessionData = {
    user_id: userId,
    vehicle_id: vehicleId,
    point_id: selectedPointId,
    start_time: startTime.toISOString(),
    meter_start: meter_start || 0,
    status: 'Active',
    created_at: startTime.toISOString()
  };

  const { data: session, error } = await supabaseAdmin
    .from('charging_sessions')
    .insert([sessionData])
    .select(`
      *,
      charging_points (
        point_id,
        name,
        power_kw,
        station_id
      ),
      vehicles (
        vehicle_id,
        plate_number,
        battery_capacity_kwh
      ),
      users (
        user_id,
        name,
        email
      )
    `)
    .single();

  if (error) {
    console.error('Error creating session:', error);
    console.error('Session data attempted:', sessionData);
    const err = new Error(`Failed to create session: ${error.message}`);
    err.status = 500;
    err.originalError = error;
    throw err;
  }

  if (!session) {
    const err = new Error('Session was not created');
    err.status = 500;
    throw err;
  }

  // Lấy thông tin station riêng vì nested query có thể không hoạt động
  let stationInfo = null;
  if (session.charging_points && session.charging_points.station_id) {
    const { data: station } = await supabaseAdmin
      .from('stations')
      .select('station_id, name, address, price_per_kwh')
      .eq('station_id', session.charging_points.station_id)
      .single();
    
    if (station) {
      stationInfo = station;
    }
  }

  // Thêm thông tin station vào session object
  if (stationInfo && session.charging_points) {
    session.charging_points.stations = stationInfo;
  }

  // Cập nhật trạng thái charging point thành InUse
  await supabaseAdmin
    .from('charging_points')
    .update({ 
      status: 'InUse',
      updated_at: startTime.toISOString()
    })
    .eq('point_id', selectedPointId);

  return {
    ...session,
    start_time: startTime.toISOString()
  };
}

/**
 * Kiểm tra hóa đơn chưa thanh toán của user
 * Input: userId
 * Output: danh sách hóa đơn chưa thanh toán hoặc trạng thái "còn nợ" / "đã thanh toán"
 */
async function getUnpaidInvoicesForUser(userId) {
  if (!userId) {
    const err = new Error('userId is required');
    err.status = 400;
    throw err;
  }

  // Lấy danh sách hóa đơn chưa thanh toán từ bảng invoices
  // Status 'Issued' hoặc các status khác 'Paid' được coi là chưa thanh toán
  const { data: unpaidInvoices, error } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      charging_sessions (
        session_id,
        start_time,
        end_time,
        energy_consumed_kwh
      ),
      payments (
        payment_id,
        amount,
        status
      )
    `)
    .eq('user_id', userId)
    .neq('status', 'Paid')
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('Error fetching unpaid invoices:', error);
    throw error;
  }

  const owes = (unpaidInvoices && unpaidInvoices.length > 0);
  
  return { 
    unpaidInvoices: unpaidInvoices || [], 
    owes,
    message: owes ? 'User has outstanding invoices' : 'No outstanding invoices'
  };
}

/**
 * Dừng phiên sạc cho một user
 * Input: sessionId, meter_end (optional)
 * Xử lý: 
 * - Kiểm tra user có hóa đơn chưa thanh toán không (chỉ được dừng nếu không còn nợ)
 * - Cập nhật trạng thái phiên sạc thành "đã dừng" (Completed)
 * - Kiểm tra thời gian sạc để tính phí đậu xe nếu vượt quá 10 phút
 * Output: thông tin phí sạc, phí đậu (nếu có)
 */
async function stopSession(sessionId, meter_end) {
  if (!sessionId) {
    const err = new Error('sessionId is required');
    err.status = 400;
    throw err;
  }

  // Lấy thông tin session
  const sessionIdInt = parseInt(sessionId);
  const { data: session, error: sessionErr } = await supabaseAdmin
    .from('charging_sessions')
    .select(`
      *,
      charging_points (
        point_id,
        name,
        power_kw,
        station_id
      ),
      vehicles (
        vehicle_id,
        plate_number,
        battery_capacity_kwh
      ),
      users (
        user_id,
        name,
        email
      )
    `)
    .eq('session_id', sessionIdInt)
    .single();

  if (sessionErr) {
    console.error('Error fetching session:', sessionErr);
    const err = new Error(`Session not found: ${sessionErr.message}`);
    err.status = 404;
    throw err;
  }

  if (!session) {
    const err = new Error(`Session with ID ${sessionIdInt} not found`);
    err.status = 404;
    throw err;
  }

  // Lấy thông tin station riêng
  let stationInfo = null;
  if (session.charging_points && session.charging_points.station_id) {
    const { data: station } = await supabaseAdmin
      .from('stations')
      .select('station_id, name, address, price_per_kwh')
      .eq('station_id', session.charging_points.station_id)
      .single();
    
    if (station) {
      stationInfo = station;
    }
  }

  // Thêm thông tin station vào session object
  if (stationInfo && session.charging_points) {
    session.charging_points.stations = stationInfo;
  }

  if (session.status !== 'Active') {
    const err = new Error(`Session is not active (current status: ${session.status})`);
    err.status = 400;
    throw err;
  }

  const userId = session.user_id;

  // Kiểm tra user có hóa đơn chưa thanh toán không
  // Staff chỉ được phép dừng phiên sạc nếu user không còn nợ
  const { data: unpaidInvoices, error: invoiceError } = await supabaseAdmin
    .from('invoices')
    .select('invoice_id, total_amount, status, issued_at')
    .eq('user_id', userId)
    .neq('status', 'Paid');

  if (invoiceError) {
    console.error('Error checking unpaid invoices:', invoiceError);
    throw invoiceError;
  }

  if (unpaidInvoices && unpaidInvoices.length > 0) {
    const err = new Error('User has outstanding invoices. Cannot stop session or allow exit. Please pay outstanding invoices first.');
    err.status = 403;
    err.data = { unpaidInvoices };
    throw err;
  }

  // Tính toán thời gian sạc
  const startTime = session.start_time ? new Date(session.start_time) : new Date();
  const endTime = new Date();
  const durationMs = endTime - startTime;
  const durationMinutes = Math.max(0, Math.ceil(durationMs / (1000 * 60)));

  // Tính phí đậu xe nếu vượt quá 10 phút
  let parkingFee = 0;
  if (durationMinutes > PARKING_GRACE_MINUTES) {
    const parkingMinutes = durationMinutes - PARKING_GRACE_MINUTES;
    parkingFee = parkingMinutes * PARKING_FEE_PER_MINUTE;
  }

  // Tính phí sạc
  let chargingCost = 0;
  let energyConsumed = null;
  
  if (meter_end !== undefined && meter_end !== null && session.meter_start !== null && session.meter_start !== undefined) {
    energyConsumed = parseFloat(meter_end) - parseFloat(session.meter_start || 0);
    if (isNaN(energyConsumed) || energyConsumed < 0) {
      energyConsumed = null;
    }
  }

  // Lấy giá điện từ station hoặc charging point
  let pricePerKwh = null;
  if (session.charging_points?.stations?.price_per_kwh) {
    pricePerKwh = parseFloat(session.charging_points.stations.price_per_kwh);
  } else if (session.charging_points?.price_rate) {
    pricePerKwh = parseFloat(session.charging_points.price_rate);
  }
  
  // Nếu vẫn chưa có, thử query trực tiếp từ station
  if (!pricePerKwh && session.charging_points?.station_id) {
    const { data: station } = await supabaseAdmin
      .from('stations')
      .select('price_per_kwh')
      .eq('station_id', session.charging_points.station_id)
      .single();
    
    if (station && station.price_per_kwh) {
      pricePerKwh = parseFloat(station.price_per_kwh);
    }
  }

  // Nếu không có giá, dùng giá mặc định (5000 VND/kWh)
  if (!pricePerKwh || pricePerKwh <= 0) {
    pricePerKwh = 5000;
  }

  // Tính phí sạc dựa trên năng lượng tiêu thụ
  if (energyConsumed !== null && energyConsumed > 0) {
    chargingCost = energyConsumed * pricePerKwh;
  }

  // Tổng phí = phí sạc + phí đậu
  const totalCost = chargingCost + parkingFee;

  // Cập nhật session với trạng thái "đã dừng" (Completed)
  const updateData = {
    status: 'Completed',
    end_time: endTime.toISOString()
  };

  if (meter_end !== undefined && meter_end !== null) {
    updateData.meter_end = parseFloat(meter_end);
  }
  
  if (energyConsumed !== null) {
    updateData.energy_consumed_kwh = parseFloat(energyConsumed.toFixed(4));
  }
  
  // Cập nhật phí đậu xe (idle_fee)
  if (parkingFee > 0) {
    updateData.idle_fee = parseFloat(parkingFee.toFixed(2));
  }

  // Cập nhật tổng chi phí (phí sạc + phí đậu)
  if (totalCost > 0) {
    updateData.cost = parseFloat(totalCost.toFixed(2));
  } else if (chargingCost > 0) {
    // Nếu chỉ có phí sạc (không có phí đậu)
    updateData.cost = parseFloat(chargingCost.toFixed(2));
  }

  const { data: updatedSession, error: updateErr } = await supabaseAdmin
    .from('charging_sessions')
    .update(updateData)
    .eq('session_id', sessionIdInt)
    .select(`
      *,
      charging_points (
        point_id,
        name,
        power_kw,
        station_id
      ),
      vehicles (
        vehicle_id,
        plate_number
      )
    `)
    .single();

  if (updateErr) {
    console.error('Error updating session:', updateErr);
    throw updateErr;
  }

  if (!updatedSession) {
    const err = new Error('Session was not updated');
    err.status = 500;
    throw err;
  }

  // Lấy thông tin station riêng
  if (updatedSession.charging_points && updatedSession.charging_points.station_id) {
    const { data: station } = await supabaseAdmin
      .from('stations')
      .select('station_id, name, address, price_per_kwh')
      .eq('station_id', updatedSession.charging_points.station_id)
      .single();
    
    if (station && updatedSession.charging_points) {
      updatedSession.charging_points.stations = station;
    }
  }

  // Cập nhật trạng thái charging point về Available
  if (session.point_id) {
    await supabaseAdmin
      .from('charging_points')
      .update({ 
        status: 'Available',
        updated_at: endTime.toISOString()
      })
      .eq('point_id', session.point_id);
  }

  return { 
    updatedSession, 
    chargingCost: parseFloat(chargingCost.toFixed(2)), 
    parkingFee: parseFloat(parkingFee.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
    durationMinutes,
    energyConsumed: energyConsumed ? parseFloat(energyConsumed.toFixed(4)) : null
  };
}

export { startSession, stopSession, getUnpaidInvoicesForUser };
