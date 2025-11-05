-- Reset session 114 start time to NOW for testing
-- This makes the session appear as if it just started

UPDATE charging_sessions
SET start_time = NOW()
WHERE session_id = 114;

-- Verify
SELECT 
    session_id,
    user_id,
    vehicle_id,
    start_time,
    initial_battery_percent,
    target_battery_percent,
    meter_start,
    status,
    EXTRACT(EPOCH FROM (NOW() - start_time)) / 60 as minutes_elapsed
FROM charging_sessions
WHERE session_id = 114;

SELECT '✅ Session 114 start time reset to NOW!' as message;
