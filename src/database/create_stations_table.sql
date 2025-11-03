-- Create stations table for EV Charging Station Management System
-- Run this SQL in Supabase SQL Editor

-- Drop table if exists (be careful in production!)
DROP TABLE IF EXISTS stations CASCADE;

-- Create stations table
CREATE TABLE stations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    zip_code TEXT,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    total_spots INTEGER NOT NULL DEFAULT 0,
    available_spots INTEGER NOT NULL DEFAULT 0,
    power_kw INTEGER NOT NULL,
    connector_type TEXT NOT NULL,
    price_per_kwh NUMERIC(10, 2) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 0.0,
    amenities TEXT[] DEFAULT '{}',
    operating_hours TEXT DEFAULT '24/7',
    phone TEXT,
    network TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Constraints
    CONSTRAINT valid_spots CHECK (available_spots >= 0 AND available_spots <= total_spots),
    CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT valid_coordinates CHECK (lat >= -90 AND lat <= 90 AND lng >= -180 AND lng <= 180)
);

-- Create indexes for better query performance
CREATE INDEX idx_stations_city ON stations(city);
CREATE INDEX idx_stations_status ON stations(status);
CREATE INDEX idx_stations_location ON stations(lat, lng);
CREATE INDEX idx_stations_available ON stations(available_spots);
CREATE INDEX idx_stations_network ON stations(network);

-- Enable Row Level Security (RLS)
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow public read access to active stations
CREATE POLICY "Allow public read access to active stations"
    ON stations FOR SELECT
    USING (status = 'active');

-- Allow authenticated users to read all stations
CREATE POLICY "Allow authenticated read access"
    ON stations FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to update availability
CREATE POLICY "Allow authenticated update availability"
    ON stations FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE stations IS 'EV charging stations with location, availability, and amenities information';

-- Grant permissions
GRANT SELECT ON stations TO anon;
GRANT ALL ON stations TO authenticated;
GRANT ALL ON stations TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Stations table created successfully!';
    RAISE NOTICE '📋 Next step: Run seedStations.js to populate data';
END $$;
