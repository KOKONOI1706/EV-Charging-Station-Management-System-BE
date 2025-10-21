-- Setup permissions for backend service_role access
-- Execute this in Supabase SQL Editor after running migration_simple.sql
-- This script disables RLS and grants necessary permissions for the backend to work

-- Step 1: Disable Row Level Security on all tables
-- (RLS can be re-enabled later with proper policies for production)
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

-- Step 2: Grant schema usage to all roles
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 3: Grant all privileges to service_role (for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Step 4: Grant basic privileges to authenticated users (for future frontend direct access if needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 5: Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- Step 6: Verify setup (optional - shows current permissions)
SELECT 
    grantee, 
    table_schema, 
    table_name, 
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name IN ('roles', 'users', 'stations', 'bookings')
GROUP BY grantee, table_schema, table_name
ORDER BY table_name, grantee;

-- Step 7: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ✅ Setup complete! Backend should now be able to access all tables.
