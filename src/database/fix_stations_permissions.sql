-- Fix permissions for stations table
-- Run this in Supabase SQL Editor if you get "permission denied" error

-- Grant full permissions to all roles
GRANT ALL ON TABLE stations TO anon;
GRANT ALL ON TABLE stations TO authenticated;
GRANT ALL ON TABLE stations TO service_role;
GRANT ALL ON TABLE stations TO postgres;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public read access to active stations" ON stations;
DROP POLICY IF EXISTS "Allow authenticated read access" ON stations;
DROP POLICY IF EXISTS "Allow authenticated update availability" ON stations;

-- Create more permissive policies
CREATE POLICY "Allow all operations for anon"
    ON stations
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated"
    ON stations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Alternatively, you can disable RLS temporarily for development
-- ALTER TABLE stations DISABLE ROW LEVEL SECURITY;

-- Verify permissions
DO $$
BEGIN
    RAISE NOTICE '✅ Permissions updated successfully!';
    RAISE NOTICE '📋 Now you can run: node seedStations.js';
END $$;

SELECT 
    'Permissions verified!' as message,
    tablename,
    (SELECT string_agg(privilege_type, ', ') 
     FROM information_schema.table_privileges 
     WHERE table_name = 'stations' AND grantee = 'anon') as anon_permissions,
    (SELECT string_agg(privilege_type, ', ') 
     FROM information_schema.table_privileges 
     WHERE table_name = 'stations' AND grantee = 'authenticated') as authenticated_permissions
FROM pg_tables 
WHERE tablename = 'stations';
