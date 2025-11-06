-- Migration: Add pos_x and pos_y columns to charging_points table
-- Purpose: Store 2D position coordinates for visual layout editor
-- Date: 2025
-- Run this in Supabase SQL Editor

-- Add position columns to charging_points table
ALTER TABLE charging_points
ADD COLUMN IF NOT EXISTS pos_x NUMERIC,
ADD COLUMN IF NOT EXISTS pos_y NUMERIC;

-- Add comment to columns
COMMENT ON COLUMN charging_points.pos_x IS '2D X-coordinate position for visual layout editor';
COMMENT ON COLUMN charging_points.pos_y IS '2D Y-coordinate position for visual layout editor';

-- Optional: Set default positions for existing points (grid layout)
-- This gives existing points a starting position
-- Using a CTE to calculate row numbers first, then update
WITH ranked_points AS (
  SELECT 
    point_id,
    station_id,
    ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY point_id) - 1 AS row_num
  FROM charging_points
  WHERE pos_x IS NULL OR pos_y IS NULL
)
UPDATE charging_points cp
SET 
  pos_x = (rp.row_num % 5) * 220 + 50,
  pos_y = FLOOR(rp.row_num / 5) * 180 + 50
FROM ranked_points rp
WHERE cp.point_id = rp.point_id;

-- Verify the changes
SELECT 
  point_id,
  name,
  station_id,
  pos_x,
  pos_y,
  status
FROM charging_points
ORDER BY station_id, point_id
LIMIT 20;

-- Success message
SELECT 'Migration completed successfully! pos_x and pos_y columns added to charging_points table.' as status;
