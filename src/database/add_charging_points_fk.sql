-- Migration: Add Foreign Key Relationship between charging_points and stations
-- Date: 2025-10-24
-- Description: Fix station_id data type mismatch (INTEGER -> UUID) and create foreign key constraint

-- ISSUE: charging_points.station_id is INTEGER but stations.id is UUID
-- SOLUTION: 
--   1. Add new UUID column (station_uuid)
--   2. Map old integer IDs to new UUIDs
--   3. Drop old column
--   4. Rename new column to station_id
--   5. Add foreign key constraint

-- =======================================
-- PART 1: ADD NEW UUID COLUMN
-- =======================================

-- Add temporary UUID column
ALTER TABLE charging_points ADD COLUMN IF NOT EXISTS station_uuid UUID;

-- =======================================
-- PART 2: MAP INTEGER IDs TO UUIDs
-- =======================================
-- Based on stations ordered by created_at:
-- 1 -> 314e91d0-c6d2-4e14-989c-ce551db0e1d9 (Central Mall Charging Hub)
-- 2 -> 48ea19cc-6133-4549-8a2b-fb79456a58b1 (Airport Express Station)
-- 3 -> 29a6d04c-144f-4c83-b62f-3f66a5800fc6 (Tech Park Station)
-- 4 -> 98748900-1a41-4df8-9642-7845f234f732 (University Hub)
-- 5 -> 3e715602-c273-432d-aa96-cd7a0063d73f (Highway Service Center)
-- 6 -> 5c0ebc19-5d1a-4619-935e-d312919a331b (Landmark 81 Premium Station)

UPDATE charging_points SET station_uuid = '314e91d0-c6d2-4e14-989c-ce551db0e1d9' WHERE station_id = 1;
UPDATE charging_points SET station_uuid = '48ea19cc-6133-4549-8a2b-fb79456a58b1' WHERE station_id = 2;
UPDATE charging_points SET station_uuid = '29a6d04c-144f-4c83-b62f-3f66a5800fc6' WHERE station_id = 3;
UPDATE charging_points SET station_uuid = '98748900-1a41-4df8-9642-7845f234f732' WHERE station_id = 4;
UPDATE charging_points SET station_uuid = '3e715602-c273-432d-aa96-cd7a0063d73f' WHERE station_id = 5;
UPDATE charging_points SET station_uuid = '5c0ebc19-5d1a-4619-935e-d312919a331b' WHERE station_id = 6;

-- Verify mapping (should return 0 if all mapped correctly)
SELECT COUNT(*) as unmapped_count 
FROM charging_points 
WHERE station_id IS NOT NULL AND station_uuid IS NULL;

-- =======================================
-- PART 3: REPLACE OLD COLUMN WITH NEW
-- =======================================

-- Drop old integer column
ALTER TABLE charging_points DROP COLUMN station_id;

-- Rename UUID column to station_id
ALTER TABLE charging_points RENAME COLUMN station_uuid TO station_id;

-- =======================================
-- PART 4: ADD FOREIGN KEY CONSTRAINT
-- =======================================

-- Drop existing constraint if it exists (for re-run safety)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'charging_points_station_id_fkey' 
        AND table_name = 'charging_points'
    ) THEN
        ALTER TABLE charging_points DROP CONSTRAINT charging_points_station_id_fkey;
    END IF;
END $$;

-- Add the foreign key constraint
ALTER TABLE charging_points 
ADD CONSTRAINT charging_points_station_id_fkey 
FOREIGN KEY (station_id) 
REFERENCES stations(id)
ON DELETE CASCADE  -- If station is deleted, also delete its charging points
ON UPDATE CASCADE; -- If station id is updated, also update in charging_points

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_charging_points_station_id ON charging_points(station_id);

-- =======================================
-- PART 5: VERIFICATION
-- =======================================

-- Verify the constraint was created
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'charging_points'
AND tc.constraint_name = 'charging_points_station_id_fkey';

-- Test join query
SELECT 
    cp.point_id,
    cp.name as charging_point_name,
    s.name as station_name
FROM charging_points cp
JOIN stations s ON cp.station_id = s.id
LIMIT 5;

-- Step 5: Verify the constraint was created
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'charging_points'
AND tc.constraint_name = 'charging_points_station_id_fkey';
