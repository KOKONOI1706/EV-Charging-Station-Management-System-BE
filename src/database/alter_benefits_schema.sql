-- Add any necessary data conversion for existing rows
ALTER TABLE service_packages
ALTER COLUMN benefits SET DEFAULT '{"label": "", "features": [], "max_sessions": null, "discount_rate": 0, "charging_speed": "", "priority_support": false}'::jsonb;