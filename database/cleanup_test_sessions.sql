-- Clean up old test sessions
-- Run this in Supabase SQL Editor

-- 1. Stop all active sessions for user 16 (your test user)
UPDATE charging_sessions
SET 
    status = 'Completed',
    end_time = NOW(),
    meter_end = meter_start + 50,  -- Add some energy consumed
    energy_consumed_kwh = 50,
    cost = 50 * 10000  -- Assume 10,000 VND per kWh
WHERE 
    user_id = 16
    AND status = 'Active';

-- 2. Verify - should show no active sessions
SELECT 
    session_id,
    user_id,
    point_id,
    start_time,
    status,
    initial_battery_percent,
    target_battery_percent
FROM charging_sessions
WHERE user_id = 16 AND status = 'Active';

-- 3. Check recent sessions
SELECT 
    session_id,
    user_id,
    vehicle_id,
    point_id,
    start_time,
    end_time,
    status,
    initial_battery_percent,
    target_battery_percent,
    meter_start,
    meter_end,
    energy_consumed_kwh
FROM charging_sessions
WHERE user_id = 16
ORDER BY start_time DESC
LIMIT 10;

SELECT '✅ Cleanup complete! You can now start a fresh session.' as message;
