-- Check for triggers on charging_sessions table
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name,
  pg_get_functiondef(tgfoid) AS function_definition
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'charging_sessions'::regclass
  AND tgname NOT LIKE 'pg_%'; -- Exclude system triggers

-- Check for functions that mention 'Occupied' or update charging_points
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname LIKE '%session%' 
   OR pg_get_functiondef(oid) LIKE '%Occupied%'
   OR pg_get_functiondef(oid) LIKE '%charging_points%status%'
ORDER BY proname;
