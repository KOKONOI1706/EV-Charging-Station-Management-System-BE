-- Add layout column to stations table to store station layout configuration
-- Run this SQL in Supabase SQL Editor

-- Add layout column as JSONB for flexible structure
ALTER TABLE stations 
ADD COLUMN IF NOT EXISTS layout JSONB DEFAULT NULL;

-- Create index on layout column for better query performance
CREATE INDEX IF NOT EXISTS idx_stations_layout ON stations USING gin(layout);

-- Add comment to layout column
COMMENT ON COLUMN stations.layout IS 'Station layout configuration including grid dimensions, facilities, and entrances (stored as JSONB)';

-- Example layout structure:
-- {
--   "width": 6,
--   "height": 4,
--   "entrances": [
--     { "x": 3, "y": 0, "direction": "north" }
--   ],
--   "facilities": [
--     { "type": "restroom", "x": 1, "y": 1, "width": 1, "height": 1 },
--     { "type": "cafe", "x": 4, "y": 1, "width": 1, "height": 1 }
--   ]
-- }

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Layout column added to stations table successfully!';
    RAISE NOTICE '📋 Stations can now store custom layout configurations';
END $$;
