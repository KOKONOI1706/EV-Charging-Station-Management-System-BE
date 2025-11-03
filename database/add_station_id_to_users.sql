-- Add station_id column to users table
-- This allows staff members to be assigned to specific charging stations

-- Add the column (nullable, since not all users are staff)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS station_id UUID;

-- Add foreign key constraint to stations table
ALTER TABLE users
ADD CONSTRAINT fk_users_station
FOREIGN KEY (station_id) 
REFERENCES stations(id)
ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_station_id ON users(station_id);

-- Add comment explaining the column
COMMENT ON COLUMN users.station_id IS 'The station ID that this staff member is assigned to. NULL for non-staff users.';

-- Show the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
