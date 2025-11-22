-- =====================================================
-- MIGRATION: Chuyển giá từ Station sang Charging Points
-- File: migrate_price_to_charging_points.sql
-- Date: 2025-11-23
-- Description: Di chuyển logic tính giá từ station-level 
--              sang charging-point-level để mỗi điểm sạc 
--              có thể có giá riêng
-- =====================================================

-- Step 1: Rename price_rate to price_per_kwh trong charging_points
-- (Nếu chưa có tên này, nếu đã có thì bỏ qua)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'charging_points' 
    AND column_name = 'price_rate'
  ) THEN
    ALTER TABLE charging_points 
    RENAME COLUMN price_rate TO price_per_kwh;
    
    RAISE NOTICE '✅ Renamed price_rate to price_per_kwh in charging_points';
  ELSE
    RAISE NOTICE '⚠️ Column price_rate not found, assuming already renamed or using different name';
  END IF;
END $$;

-- Step 2: Ensure price_per_kwh has proper constraint
ALTER TABLE charging_points 
ALTER COLUMN price_per_kwh SET NOT NULL;

ALTER TABLE charging_points 
ALTER COLUMN price_per_kwh SET DEFAULT 0;

-- Add check constraint để đảm bảo giá không âm
ALTER TABLE charging_points 
ADD CONSTRAINT check_price_per_kwh_non_negative 
CHECK (price_per_kwh >= 0);

-- Step 3: Migrate existing data from stations to charging_points
-- Copy giá từ station sang tất cả charging points thuộc station đó
UPDATE charging_points cp
SET price_per_kwh = s.price_per_kwh,
    updated_at = now()
FROM stations s
WHERE cp.station_id = s.id
  AND (cp.price_per_kwh IS NULL OR cp.price_per_kwh = 0);

-- Step 4: Add comment để document
COMMENT ON COLUMN charging_points.price_per_kwh IS 
'Giá điện mỗi kWh cho điểm sạc này (VND/kWh). Mỗi điểm sạc có thể có giá khác nhau.';

-- Step 5 (Optional): Deprecate stations.price_per_kwh
-- Có 2 options:

-- OPTION A: Giữ lại làm default value cho charging points mới
COMMENT ON COLUMN stations.price_per_kwh IS 
'[DEPRECATED] Giá mặc định cho station. Sử dụng charging_points.price_per_kwh thay thế. Field này chỉ dùng làm default khi tạo charging point mới.';

-- OPTION B: Xóa hoàn toàn (không khuyến khích vì có thể phá vỡ code cũ)
-- ALTER TABLE stations DROP COLUMN price_per_kwh;

-- Step 6: Create trigger để tự động set giá khi tạo charging point mới
CREATE OR REPLACE FUNCTION set_default_price_for_new_point()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu price_per_kwh chưa được set, lấy từ station
  IF NEW.price_per_kwh IS NULL OR NEW.price_per_kwh = 0 THEN
    SELECT price_per_kwh INTO NEW.price_per_kwh
    FROM stations
    WHERE id = NEW.station_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_default_price
BEFORE INSERT ON charging_points
FOR EACH ROW
EXECUTE FUNCTION set_default_price_for_new_point();

-- Step 7: Verification queries
DO $$
DECLARE
  total_points INTEGER;
  points_with_price INTEGER;
  points_without_price INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_points FROM charging_points;
  SELECT COUNT(*) INTO points_with_price FROM charging_points WHERE price_per_kwh > 0;
  SELECT COUNT(*) INTO points_without_price FROM charging_points WHERE price_per_kwh = 0 OR price_per_kwh IS NULL;
  
  RAISE NOTICE '=== MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Total charging points: %', total_points;
  RAISE NOTICE 'Points with price: %', points_with_price;
  RAISE NOTICE 'Points without price: %', points_without_price;
  
  IF points_without_price > 0 THEN
    RAISE WARNING '⚠️ Some charging points still have no price! Check manually.';
  ELSE
    RAISE NOTICE '✅ All charging points have prices set!';
  END IF;
END $$;

-- Step 8: Sample data update (example)
-- Nếu muốn set giá khác nhau cho các loại charging point
-- VD: Fast charger đắt hơn normal charger

-- Fast chargers (>50kW) có giá cao hơn 20%
UPDATE charging_points 
SET price_per_kwh = price_per_kwh * 1.2,
    updated_at = now()
WHERE power_kw > 50;

-- Ultra-fast chargers (>150kW) có giá cao hơn 50%
UPDATE charging_points 
SET price_per_kwh = price_per_kwh * 1.5,
    updated_at = now()
WHERE power_kw > 150;

COMMENT ON COLUMN charging_points.price_per_kwh IS 
'Giá điện mỗi kWh (VND/kWh). Giá có thể khác nhau tùy theo công suất: 
- Normal (≤50kW): Giá cơ bản
- Fast (50-150kW): +20% giá cơ bản  
- Ultra-Fast (>150kW): +50% giá cơ bản';

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
/*
-- To rollback this migration:

-- 1. Drop trigger
DROP TRIGGER IF EXISTS trigger_set_default_price ON charging_points;
DROP FUNCTION IF EXISTS set_default_price_for_new_point();

-- 2. Rename back
ALTER TABLE charging_points RENAME COLUMN price_per_kwh TO price_rate;

-- 3. Remove constraints
ALTER TABLE charging_points DROP CONSTRAINT IF EXISTS check_price_per_kwh_non_negative;

-- 4. Reset to defaults
UPDATE charging_points SET price_rate = 0;
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================
