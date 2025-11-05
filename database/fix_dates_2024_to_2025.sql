-- Update existing booking dates from 2024 to 2025
-- This fixes the issue where sample bookings were created with past dates

-- Update bookings
UPDATE bookings
SET 
    start_time = start_time + INTERVAL '1 year',
    expire_time = expire_time + INTERVAL '1 year',
    confirmed_at = CASE 
        WHEN confirmed_at IS NOT NULL THEN confirmed_at + INTERVAL '1 year'
        ELSE NULL
    END,
    updated_at = NOW()
WHERE start_time < '2025-01-01';

-- Update charging_sessions
UPDATE charging_sessions
SET 
    start_time = start_time + INTERVAL '1 year',
    end_time = CASE 
        WHEN end_time IS NOT NULL THEN end_time + INTERVAL '1 year'
        ELSE NULL
    END,
    created_at = created_at + INTERVAL '1 year'
WHERE start_time < '2025-01-01';

-- Update payments date field if it references old dates
UPDATE payments
SET 
    date = date + INTERVAL '1 year',
    created_at = created_at + INTERVAL '1 year'
WHERE date < '2025-01-01';

-- Verify the changes
SELECT 
    'Bookings' as table_name,
    COUNT(*) as total_records,
    MIN(start_time) as earliest_booking,
    MAX(start_time) as latest_booking
FROM bookings
UNION ALL
SELECT 
    'Charging Sessions',
    COUNT(*),
    MIN(start_time),
    MAX(start_time)
FROM charging_sessions
UNION ALL
SELECT 
    'Payments',
    COUNT(*),
    MIN(date),
    MAX(date)
FROM payments;

-- Show updated bookings
SELECT 
    booking_id,
    user_id,
    point_id,
    start_time,
    expire_time,
    status,
    confirmed_at
FROM bookings
ORDER BY start_time DESC;

SELECT '✅ Successfully updated all dates to 2025!' as status;
