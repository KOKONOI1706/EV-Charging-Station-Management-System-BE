-- Fix RLS (Row Level Security) permissions for backend service_role access
-- Execute this in Supabase SQL Editor

-- Disable RLS on tables that backend needs to access directly
-- This allows service_role key to read/write without policy restrictions

ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE charging_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE charging_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;
ALTER TABLE connector_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE station_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled (optional check)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('roles', 'users', 'stations', 'bookings')
ORDER BY tablename;

-- Note: Disabling RLS means any authenticated request can access these tables.
-- In production, you should create proper RLS policies instead of disabling RLS entirely.
-- For now, this allows your backend service_role to work immediately.
