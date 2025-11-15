import { supabaseAdmin } from '../config/supabase.js';

const PARKING_FEE_PER_MINUTE = parseFloat(process.env.PARKING_FEE_PER_MINUTE || '0.5');
const PARKING_GRACE_MINUTES = parseInt(process.env.PARKING_GRACE_MINUTES || '10', 10);

async function startSession({ userId, vehicleId, stationId, pointId = null, meter_start = null }) {
  if (!userId || !vehicleId || !stationId) {
    const err = new Error('Missing required fields: userId, vehicleId, stationId');
    err.status = 400;
    throw err;
  }

  const sessionData = {
    user_id: userId,
    vehicle_id: vehicleId,
    point_id: pointId || null,
    station_id: stationId,
    start_time: new Date().toISOString(),
    meter_start: meter_start || null,
    status: 'Active',
    created_at: new Date().toISOString()
  };

  const { data: session, error } = await supabaseAdmin
    .from('charging_sessions')
    .insert([sessionData])
    .select(`*, charging_points (*), stations (*)`)
    .single();

  if (error) throw error;
  return session;
}

async function getUnpaidInvoicesForUser(userId) {
  if (!userId) {
    const err = new Error('userId is required');
    err.status = 400;
    throw err;
  }

  const { data: reservations } = await supabaseAdmin
    .from('reservations')
    .select('id')
    .eq('user_id', userId);

  const reservationIds = (reservations || []).map(r => r.id).filter(Boolean);

  const { data: unpaidPayments, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .in('reservation_id', reservationIds.length ? reservationIds : [-1])
    .neq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const owes = (unpaidPayments && unpaidPayments.length > 0);
  return { unpaidPayments: unpaidPayments || [], owes };
}

async function stopSession(sessionId, meter_end) {
  if (!sessionId) {
    const err = new Error('sessionId is required');
    err.status = 400;
    throw err;
  }

  const { data: session, error: sessionErr } = await supabaseAdmin
    .from('charging_sessions')
    .select(`*, reservations (*), charging_points (*), stations (*)`)
    .eq('session_id', sessionId)
    .single();

  if (sessionErr || !session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }

  if (session.status !== 'Active') {
    const err = new Error('Session is not active');
    err.status = 400;
    throw err;
  }

  const userId = session.user_id;

  // Find reservations for user
  const { data: reservations } = await supabaseAdmin
    .from('reservations')
    .select('id')
    .eq('user_id', userId);

  const reservationIds = (reservations || []).map(r => r.id).filter(Boolean);

  // Get payments for those reservations where status != completed
  const { data: unpaidForUser } = await supabaseAdmin
    .from('payments')
    .select('*')
    .in('reservation_id', reservationIds.length ? reservationIds : [-1])
    .neq('status', 'completed');

  if (unpaidForUser && unpaidForUser.length > 0) {
    const err = new Error('User has outstanding invoices. Cannot stop session or allow exit.');
    err.status = 403;
    throw err;
  }

  const start = session.start_time ? new Date(session.start_time) : null;
  const end = new Date();
  const durationMs = start ? (end - start) : 0;
  const durationMinutes = Math.max(0, Math.ceil((durationMs / 1000) / 60));

  let parkingFee = 0;
  if (durationMinutes > PARKING_GRACE_MINUTES) {
    parkingFee = (durationMinutes - PARKING_GRACE_MINUTES) * PARKING_FEE_PER_MINUTE;
  }

  let chargingCost = 0;
  let energyConsumed = null;
  if (meter_end !== undefined && session.meter_start !== null && session.meter_start !== undefined) {
    energyConsumed = parseFloat(meter_end) - parseFloat(session.meter_start || 0);
    if (isNaN(energyConsumed) || energyConsumed < 0) energyConsumed = null;
  }

  let pricePerKwh = null;
  if (session.charging_points && session.charging_points.price_per_kwh) {
    pricePerKwh = parseFloat(session.charging_points.price_per_kwh);
  } else if (session.stations && session.stations.price_per_kwh) {
    pricePerKwh = parseFloat(session.stations.price_per_kwh);
  }

  if (energyConsumed !== null && pricePerKwh) {
    chargingCost = energyConsumed * pricePerKwh;
  }

  const updateData = {
    status: 'Completed',
    end_time: end.toISOString(),
    updated_at: new Date().toISOString()
  };

  if (meter_end !== undefined) updateData.meter_end = meter_end;
  if (energyConsumed !== null) updateData.energy_consumed_kwh = energyConsumed;
  if (chargingCost) updateData.cost = chargingCost;
  if (parkingFee) updateData.parking_fee = parkingFee;

  const { data: updatedSession, error: updateErr } = await supabaseAdmin
    .from('charging_sessions')
    .update(updateData)
    .eq('session_id', sessionId)
    .select('*')
    .single();

  if (updateErr) throw updateErr;

  return { updatedSession, chargingCost, parkingFee, durationMinutes };
}

export { startSession, stopSession, getUnpaidInvoicesForUser };
