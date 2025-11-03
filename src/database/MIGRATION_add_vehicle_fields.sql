-- =====================================================
-- MIGRATION: Add vehicle fields to vehicles table
-- Date: 2025-10-31
-- Description: Add make, model, year, color, updated_at fields
-- =====================================================

-- Add new columns to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS make varchar(100),
ADD COLUMN IF NOT EXISTS model varchar(100),
ADD COLUMN IF NOT EXISTS year int,
ADD COLUMN IF NOT EXISTS color varchar(50),
ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT (now());

-- Add comments for documentation
COMMENT ON COLUMN vehicles.make IS 'Vehicle manufacturer (e.g., Tesla, VinFast, Toyota)';
COMMENT ON COLUMN vehicles.model IS 'Vehicle model (e.g., Model 3, VF 8, Camry)';
COMMENT ON COLUMN vehicles.year IS 'Year of manufacture (e.g., 2023, 2024)';
COMMENT ON COLUMN vehicles.color IS 'Vehicle color (e.g., White, Black, Red)';
COMMENT ON COLUMN vehicles.plate_number IS 'Vehicle license plate number';
COMMENT ON COLUMN vehicles.battery_capacity_kwh IS 'Battery capacity in kilowatt-hours';

-- Create or replace function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS set_vehicles_updated_at ON vehicles;
CREATE TRIGGER set_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicles_updated_at();

-- Verify the changes
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- Show sample query to verify
SELECT 
    vehicle_id, 
    user_id, 
    plate_number, 
    make, 
    model, 
    year, 
    color, 
    battery_capacity_kwh,
    created_at,
    updated_at
FROM vehicles
LIMIT 1;
