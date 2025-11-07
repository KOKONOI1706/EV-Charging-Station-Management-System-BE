-- Check active sessions for user 16
SELECT 
  session_id,
  user_id,
  point_id,
  status,
  start_time,
  created_at
FROM charging_sessions
WHERE user_id = 16 
  AND status = 'Active'
ORDER BY start_time DESC
LIMIT 5;

-- Check all recent sessions for user 16
SELECT 
  session_id,
  user_id,
  point_id,
  status,
  start_time,
  end_time,
  created_at
FROM charging_sessions
WHERE user_id = 16
ORDER BY created_at DESC
LIMIT 10;
