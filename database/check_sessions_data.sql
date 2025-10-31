-- Check if there's any data in charging_sessions table
SELECT COUNT(*) as total_sessions,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
       SUM(CASE WHEN status = 'completed' THEN cost ELSE 0 END) as total_revenue
FROM charging_sessions;

-- Check recent sessions
SELECT session_id, user_id, start_time, end_time, cost, status
FROM charging_sessions
ORDER BY start_time DESC
LIMIT 10;
