-- Fix price_per_kwh from USD to VND
-- Current values are in USD (e.g., 0.35, 0.42)
-- Need to convert to VND (multiply by ~24000)

-- ⚠️ BACKUP FIRST!
-- SELECT id, name, price_per_kwh FROM stations;

-- Update all stations with price < 10 (assumed to be USD)
UPDATE stations
SET price_per_kwh = price_per_kwh * 24000
WHERE price_per_kwh < 10;

-- Verify the changes
SELECT 
    id,
    name,
    price_per_kwh as "Price (VND/kWh)",
    ROUND(price_per_kwh / 24000, 2) as "Price (USD/kWh)"
FROM stations
ORDER BY price_per_kwh;

-- Expected results:
-- 0.30 USD -> 7,200 VND
-- 0.32 USD -> 7,680 VND
-- 0.35 USD -> 8,400 VND
-- 0.38 USD -> 9,120 VND
-- 0.42 USD -> 10,080 VND
-- 0.45 USD -> 10,800 VND

-- Show summary
SELECT 
    '✅ Fixed prices for ' || COUNT(*) || ' stations!' as message,
    MIN(price_per_kwh) as min_price_vnd,
    MAX(price_per_kwh) as max_price_vnd,
    ROUND(AVG(price_per_kwh), 0) as avg_price_vnd
FROM stations;
