-- Add additional fields to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS make varchar(100),
ADD COLUMN IF NOT EXISTS model varchar(100),
ADD COLUMN IF NOT EXISTS year int,
ADD COLUMN IF NOT EXISTS color varchar(50),
ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT (now());

-- Add comment to table
COMMENT ON TABLE vehicles IS 'Stores user vehicle information for EV charging';
COMMENT ON COLUMN vehicles.make IS 'Vehicle manufacturer (e.g., Tesla, VinFast)';
COMMENT ON COLUMN vehicles.model IS 'Vehicle model (e.g., Model 3, VF 8)';
COMMENT ON COLUMN vehicles.year IS 'Year of manufacture';
COMMENT ON COLUMN vehicles.color IS 'Vehicle color';
COMMENT ON COLUMN vehicles.plate_number IS 'Vehicle license plate number';
COMMENT ON COLUMN vehicles.battery_capacity_kwh IS 'Battery capacity in kilowatt-hours';
