-- Create service_packages table if not exists and insert sample data
CREATE TABLE IF NOT EXISTS service_packages (
    package_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    benefits JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample packages if table is empty
INSERT INTO service_packages (name, description, price, duration_days, benefits, status)
SELECT 'Basic', 'Perfect for occasional charging', 0.00, 30, 
       '{"discount_rate": 0, "bonus_minutes": 0, "max_sessions": 5, "priority_support": false, "support_24_7": false}',
       'active'
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE name = 'Basic');

INSERT INTO service_packages (name, description, price, duration_days, benefits, status)
SELECT 'Plus', 'Great for regular commuters', 299000.00, 30,
       '{"discount_rate": 10, "bonus_minutes": 60, "max_sessions": 20, "priority_support": true, "support_24_7": false, "booking_priority": true}',
       'active'
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE name = 'Plus');

INSERT INTO service_packages (name, description, price, duration_days, benefits, status)
SELECT 'Premium', 'Best value for frequent travelers', 599000.00, 30,
       '{"discount_rate": 20, "bonus_minutes": 120, "max_sessions": 50, "priority_support": true, "support_24_7": true, "booking_priority": true, "free_start_fee": true, "energy_tracking": true}',
       'active'
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE name = 'Premium');

-- Show created packages
SELECT * FROM service_packages ORDER BY package_id;