-- Temporarily disable RLS for testing
ALTER TABLE service_packages DISABLE ROW LEVEL SECURITY;

-- Grant permissions without RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON service_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_packages TO anon;
GRANT USAGE, SELECT ON SEQUENCE service_packages_package_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE service_packages_package_id_seq TO anon;

-- Test query
SELECT COUNT(*) as package_count FROM service_packages;