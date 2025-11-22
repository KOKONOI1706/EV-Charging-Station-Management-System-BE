-- Grant permissions for service_packages table
-- This script should be run as superuser/admin in Supabase SQL Editor

-- Enable RLS
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON service_packages TO authenticated;
GRANT ALL ON service_packages TO anon;

-- Create RLS policies for service_packages
CREATE POLICY "Allow all operations on service_packages" ON service_packages
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow anonymous access for read operations
CREATE POLICY "Allow read access for anonymous" ON service_packages
  FOR SELECT
  TO anon
  USING (true);

-- Grant usage on the sequence
GRANT USAGE, SELECT ON SEQUENCE service_packages_package_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE service_packages_package_id_seq TO anon;

-- Verify the table exists and show its structure
SELECT * FROM information_schema.tables WHERE table_name = 'service_packages';
SELECT * FROM information_schema.columns WHERE table_name = 'service_packages' ORDER BY ordinal_position;