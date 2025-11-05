-- Delete all data for user 16 (cascade delete)
-- Run this in Supabase SQL Editor

-- Step 1: Delete payments first (foreign key constraint)
DELETE FROM payments
WHERE session_id IN (
    SELECT session_id 
    FROM charging_sessions 
    WHERE user_id = 16
);

-- Step 2: Delete charging sessions
DELETE FROM charging_sessions
WHERE user_id = 16;

-- Step 3: Delete bookings (optional, if you want clean slate)
DELETE FROM bookings
WHERE user_id = 16;

-- Step 4: Verify all deleted
SELECT 
    'payments' as table_name,
    COUNT(*) as count
FROM payments p
JOIN charging_sessions cs ON p.session_id = cs.session_id
WHERE cs.user_id = 16

UNION ALL

SELECT 
    'charging_sessions' as table_name,
    COUNT(*) as count
FROM charging_sessions
WHERE user_id = 16

UNION ALL

SELECT 
    'bookings' as table_name,
    COUNT(*) as count
FROM bookings
WHERE user_id = 16;

-- All counts should be 0

SELECT '✅ All data deleted for user 16! You can now create fresh sessions.' as message;
