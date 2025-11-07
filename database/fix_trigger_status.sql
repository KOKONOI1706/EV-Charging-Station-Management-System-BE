-- Fix the trigger function to use 'InUse' instead of 'Occupied'
CREATE OR REPLACE FUNCTION public.update_charging_point_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- When booking is created
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'bookings' THEN
    IF NEW.status = 'Confirmed' THEN
      UPDATE charging_points 
      SET status = 'Reserved' 
      WHERE point_id = NEW.point_id;
    END IF;
  END IF;

  -- When booking is cancelled/expired
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'bookings' THEN
    IF OLD.status IN ('Confirmed', 'Active') AND NEW.status IN ('Cancelled', 'Expired') THEN
      -- Check if no active session on this point
      IF NOT EXISTS (
        SELECT 1 FROM charging_sessions 
        WHERE point_id = OLD.point_id AND status = 'Active'
      ) THEN
        UPDATE charging_points 
        SET status = 'Available' 
        WHERE point_id = OLD.point_id;
      END IF;
    END IF;
  END IF;

  -- When session starts
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'charging_sessions' THEN
    IF NEW.status = 'Active' THEN
      UPDATE charging_points 
      SET status = 'InUse'  -- ✅ FIXED: Changed from 'Occupied' to 'InUse'
      WHERE point_id = NEW.point_id;
      
      -- Mark booking as Active if exists
      IF NEW.booking_id IS NOT NULL THEN
        UPDATE bookings 
        SET status = 'Active' 
        WHERE booking_id = NEW.booking_id;
      END IF;
    END IF;
  END IF;

  -- When session ends
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'charging_sessions' THEN
    IF OLD.status = 'Active' AND NEW.status = 'Completed' THEN
      -- Check if no other active session on this point
      IF NOT EXISTS (
        SELECT 1 FROM charging_sessions 
        WHERE point_id = OLD.point_id 
          AND status = 'Active' 
          AND session_id != NEW.session_id
      ) THEN
        UPDATE charging_points 
        SET status = 'Available' 
        WHERE point_id = OLD.point_id;
      END IF;
      
      -- Mark booking as Completed if exists
      IF NEW.booking_id IS NOT NULL THEN
        UPDATE bookings 
        SET status = 'Completed' 
        WHERE booking_id = NEW.booking_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Verify the fix
SELECT proname, pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_charging_point_status';
