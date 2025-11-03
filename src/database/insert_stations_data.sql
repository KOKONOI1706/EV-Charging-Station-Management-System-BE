-- Insert sample stations data directly into Supabase
-- Run this in Supabase SQL Editor

-- First, disable RLS if needed
ALTER TABLE stations DISABLE ROW LEVEL SECURITY;

-- Insert 6 sample charging stations in Ho Chi Minh City
INSERT INTO stations (
    name, address, city, state, zip_code, 
    lat, lng, total_spots, available_spots, 
    power_kw, connector_type, price_per_kwh, rating, 
    amenities, operating_hours, phone, network, status
) VALUES
(
    'Central Mall Charging Hub',
    '123 Nguyen Hue, District 1',
    'Ho Chi Minh City',
    'Ho Chi Minh',
    '700000',
    10.7769,
    106.7009,
    8,
    6,
    150,
    'CCS, CHAdeMO, Type2',
    0.35,
    4.8,
    ARRAY['WiFi', 'Restroom', 'Cafe', 'Shopping'],
    '24/7',
    '+84 28 3829 5000',
    'ChargeTech',
    'active'
),
(
    'Airport Express Station',
    '456 Tan Son Nhat Airport, Tan Binh District',
    'Ho Chi Minh City',
    'Ho Chi Minh',
    '700000',
    10.8231,
    106.6297,
    12,
    9,
    350,
    'CCS, CHAdeMO',
    0.42,
    4.9,
    ARRAY['WiFi', 'Restroom', 'Cafe', 'Lounge', 'Duty Free'],
    '24/7',
    '+84 28 3848 5000',
    'ChargeTech',
    'active'
),
(
    'Tech Park Station',
    '789 Quang Trung Software City, District 12',
    'Ho Chi Minh City',
    'Ho Chi Minh',
    '700000',
    10.8506,
    106.6200,
    6,
    4,
    150,
    'CCS, Type2',
    0.32,
    4.6,
    ARRAY['WiFi', 'Parking', 'Cafe'],
    '6:00 AM - 10:00 PM',
    '+84 28 3715 5000',
    'ChargeTech',
    'active'
),
(
    'University Hub',
    '321 Linh Trung, Thu Duc City',
    'Ho Chi Minh City',
    'Ho Chi Minh',
    '700000',
    10.8700,
    106.8030,
    10,
    7,
    150,
    'CCS, CHAdeMO, Type2',
    0.30,
    4.7,
    ARRAY['WiFi', 'Restroom', 'Study Area', 'Food Court'],
    '24/7',
    '+84 28 3724 5000',
    'ChargeTech',
    'active'
),
(
    'Highway Service Center',
    '555 National Highway 1A, Binh Chanh District',
    'Ho Chi Minh City',
    'Ho Chi Minh',
    '700000',
    10.7500,
    106.6000,
    4,
    3,
    150,
    'CCS, CHAdeMO',
    0.38,
    4.5,
    ARRAY['Restroom', 'Convenience Store', 'Parking'],
    '24/7',
    '+84 28 3750 5000',
    'ChargeTech',
    'active'
),
(
    'Landmark 81 Premium Station',
    '720A Dien Bien Phu, Binh Thanh District',
    'Ho Chi Minh City',
    'Ho Chi Minh',
    '700000',
    10.7943,
    106.7212,
    15,
    11,
    350,
    'CCS, Tesla, CHAdeMO',
    0.45,
    4.9,
    ARRAY['WiFi', 'Restroom', 'Valet', 'Lounge', 'Fine Dining'],
    '24/7',
    '+84 28 3636 8888',
    'ChargeTech Premium',
    'active'
);

-- Verify the data
SELECT 
    '✅ Successfully inserted ' || COUNT(*) || ' stations!' as message,
    COUNT(*) as total_stations,
    SUM(total_spots) as total_charging_spots,
    SUM(available_spots) as available_charging_spots
FROM stations;

-- Show all stations
SELECT 
    name,
    city,
    available_spots || '/' || total_spots as availability,
    power_kw || 'kW' as power,
    connector_type,
    network
FROM stations
ORDER BY name;
