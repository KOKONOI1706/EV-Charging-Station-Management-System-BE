-- Add 'Active' status to bookings for when charging session is in progress

-- Option 1: Add enum value if using enum type
-- ALTER TYPE booking_status ADD VALUE 'Active';

-- Option 2: Since it's just varchar, no schema change needed
-- Just update application logic to use 'Active' status

-- Update booking to Active when session starts
UPDATE bookings
SET status = 'Active',
    updated_at = NOW()
WHERE booking_id = $1;

-- Update booking to Completed when session ends
UPDATE bookings  
SET status = 'Completed',
    updated_at = NOW()
WHERE booking_id = $1;

-- Document valid booking statuses:
-- 'Pending'   - Booking created, waiting for confirmation
-- 'Confirmed' - Booking confirmed, user can start charging
-- 'Active'    - Charging session is currently running
-- 'Completed' - Charging session finished successfully
-- 'Canceled'  - Booking was canceled before use
-- 'Expired'   - Booking time passed without use
