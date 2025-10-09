-- Migration file for EV Charging Station Management System
-- Simplified version without PostGIS for initial setup
-- Execute this in Supabase SQL Editor

-- Create tables from dbdiagram export

CREATE TABLE "roles" (
  "role_id" serial PRIMARY KEY,
  "name" varchar(50) UNIQUE NOT NULL
);

CREATE TABLE "users" (
  "user_id" serial PRIMARY KEY,
  "name" varchar(200) NOT NULL,
  "email" varchar(255) UNIQUE,
  "phone" varchar(30) UNIQUE,
  "role_id" int NOT NULL,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now()),
  "is_active" boolean DEFAULT (true)
);

CREATE TABLE "connector_types" (
  "connector_type_id" serial PRIMARY KEY,
  "code" varchar(50) UNIQUE,
  "name" varchar(100),
  "max_power_kw" numeric(8,2)
);

CREATE TABLE "vehicles" (
  "vehicle_id" serial PRIMARY KEY,
  "user_id" int,
  "plate_number" varchar(50) NOT NULL,
  "battery_capacity_kwh" numeric(10,3),
  "connector_type_id" int,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "stations" (
  "station_id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "address" text,
  "latitude" numeric(10,7),
  "longitude" numeric(10,7),
  "total_points" int DEFAULT 0,
  "status" varchar(50) DEFAULT 'Available',
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now()),
  "last_seen_at" timestamp
);

CREATE TABLE "station_images" (
  "image_id" serial PRIMARY KEY,
  "station_id" int,
  "url" text NOT NULL,
  "alt_text" varchar(255),
  "uploaded_at" timestamp DEFAULT (now())
);

CREATE TABLE "charging_points" (
  "point_id" serial PRIMARY KEY,
  "station_id" int,
  "connector_type_id" int,
  "name" varchar(100),
  "status" varchar(50) DEFAULT 'Available',
  "power_kw" numeric(8,2),
  "price_rate" numeric(12,2) DEFAULT 0,
  "idle_fee_per_min" numeric(12,2) DEFAULT 0,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now()),
  "last_seen_at" timestamp
);

CREATE TABLE "service_packages" (
  "package_id" serial PRIMARY KEY,
  "name" varchar(150) NOT NULL,
  "description" text,
  "price" numeric(12,2) DEFAULT 0,
  "duration_days" int DEFAULT 30,
  "benefits" jsonb,
  "status" varchar(50) DEFAULT 'Active',
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "user_packages" (
  "user_package_id" serial PRIMARY KEY,
  "user_id" int,
  "package_id" int,
  "start_date" timestamp DEFAULT (now()),
  "end_date" timestamp,
  "status" varchar(50) DEFAULT 'Active',
  "auto_renew" boolean DEFAULT (false),
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "promotions" (
  "promotion_id" serial PRIMARY KEY,
  "code" varchar(100) UNIQUE,
  "description" text,
  "discount_type" varchar(20),
  "discount_pct" numeric(5,2),
  "discount_amount" numeric(12,2),
  "valid_from" timestamp,
  "valid_to" timestamp,
  "usage_limit" int,
  "per_user_limit" int,
  "active" boolean DEFAULT (true),
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "bookings" (
  "booking_id" serial PRIMARY KEY,
  "user_id" int,
  "point_id" int,
  "start_time" timestamp NOT NULL,
  "expire_time" timestamp NOT NULL,
  "status" varchar(50) DEFAULT 'Pending',
  "confirmed_at" timestamp,
  "canceled_at" timestamp,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now()),
  "promo_id" int,
  "price_estimate" numeric(12,2)
);

CREATE TABLE "charging_sessions" (
  "session_id" serial PRIMARY KEY,
  "user_id" int,
  "vehicle_id" int,
  "point_id" int,
  "booking_id" int,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp,
  "meter_start" numeric(12,4),
  "meter_end" numeric(12,4),
  "energy_consumed_kwh" numeric(12,4) DEFAULT 0,
  "idle_minutes" int DEFAULT 0,
  "idle_fee" numeric(12,2) DEFAULT 0,
  "cost" numeric(12,2) DEFAULT 0,
  "payment_id" int,
  "status" varchar(50) DEFAULT 'Active',
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "payment_methods" (
  "method_id" serial PRIMARY KEY,
  "code" varchar(50) UNIQUE,
  "name" varchar(100)
);

CREATE TABLE "payments" (
  "payment_id" serial PRIMARY KEY,
  "user_id" int,
  "method_id" int,
  "amount" numeric(12,2) NOT NULL,
  "currency" varchar(10) DEFAULT 'VND',
  "date" timestamp DEFAULT (now()),
  "status" varchar(50) DEFAULT 'Pending',
  "external_reference" varchar(255),
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "invoices" (
  "invoice_id" serial PRIMARY KEY,
  "user_id" int,
  "session_id" int,
  "payment_id" int,
  "total_amount" numeric(12,2),
  "issued_at" timestamp DEFAULT (now()),
  "status" varchar(50) DEFAULT 'Issued'
);

CREATE TABLE "reports" (
  "report_id" serial PRIMARY KEY,
  "admin_id" int,
  "station_id" int,
  "report_type" varchar(100),
  "period" varchar(100),
  "data_summary" text,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "notifications" (
  "notification_id" serial PRIMARY KEY,
  "user_id" int,
  "message" text,
  "type" varchar(50),
  "sent_time" timestamp DEFAULT (now()),
  "status" varchar(50) DEFAULT 'Sent'
);

CREATE TABLE "feedbacks" (
  "feedback_id" serial PRIMARY KEY,
  "user_id" int,
  "station_id" int,
  "rating" smallint CHECK (rating >= 1 AND rating <= 5),
  "comment" text,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "maintenances" (
  "maintenance_id" serial PRIMARY KEY,
  "station_id" int,
  "point_id" int,
  "reported_by" int,
  "assigned_to" int,
  "description" text,
  "status" varchar(50) DEFAULT 'Open',
  "reported_at" timestamp DEFAULT (now()),
  "resolved_at" timestamp
);

CREATE TABLE "audit_logs" (
  "audit_id" bigint PRIMARY KEY,
  "actor_user_id" int,
  "action_type" varchar(100),
  "target_table" varchar(100),
  "target_id" bigint,
  "payload" jsonb,
  "created_at" timestamp DEFAULT (now()),
  "ip_address" varchar(100)
);

CREATE TABLE "system_settings" (
  "key" varchar(200) PRIMARY KEY,
  "value" text,
  "description" text,
  "updated_at" timestamp DEFAULT (now())
);

-- Create indexes for better performance
CREATE INDEX ON "users" ("email");
CREATE INDEX ON "users" ("phone");
CREATE INDEX ON "vehicles" ("plate_number");
CREATE INDEX ON "stations" ("latitude", "longitude");
CREATE INDEX ON "charging_points" ("status");
CREATE INDEX ON "bookings" ("start_time");
CREATE INDEX ON "bookings" ("user_id");
CREATE INDEX ON "charging_sessions" ("user_id");
CREATE INDEX ON "charging_sessions" ("start_time");
CREATE INDEX ON "payments" ("user_id");
CREATE INDEX ON "notifications" ("user_id");

-- Add foreign key constraints
ALTER TABLE "users" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("role_id");
ALTER TABLE "vehicles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
ALTER TABLE "vehicles" ADD FOREIGN KEY ("connector_type_id") REFERENCES "connector_types" ("connector_type_id");
ALTER TABLE "station_images" ADD FOREIGN KEY ("station_id") REFERENCES "stations" ("station_id");
ALTER TABLE "charging_points" ADD FOREIGN KEY ("station_id") REFERENCES "stations" ("station_id");
ALTER TABLE "charging_points" ADD FOREIGN KEY ("connector_type_id") REFERENCES "connector_types" ("connector_type_id");
ALTER TABLE "user_packages" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
ALTER TABLE "user_packages" ADD FOREIGN KEY ("package_id") REFERENCES "service_packages" ("package_id");
ALTER TABLE "bookings" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
ALTER TABLE "bookings" ADD FOREIGN KEY ("point_id") REFERENCES "charging_points" ("point_id");
ALTER TABLE "bookings" ADD FOREIGN KEY ("promo_id") REFERENCES "promotions" ("promotion_id");
ALTER TABLE "charging_sessions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
ALTER TABLE "charging_sessions" ADD FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("vehicle_id");
ALTER TABLE "charging_sessions" ADD FOREIGN KEY ("point_id") REFERENCES "charging_points" ("point_id");
ALTER TABLE "charging_sessions" ADD FOREIGN KEY ("booking_id") REFERENCES "bookings" ("booking_id");
ALTER TABLE "charging_sessions" ADD FOREIGN KEY ("payment_id") REFERENCES "payments" ("payment_id");
ALTER TABLE "payments" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
ALTER TABLE "payments" ADD FOREIGN KEY ("method_id") REFERENCES "payment_methods" ("method_id");
ALTER TABLE "invoices" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
ALTER TABLE "invoices" ADD FOREIGN KEY ("session_id") REFERENCES "charging_sessions" ("session_id");
ALTER TABLE "invoices" ADD FOREIGN KEY ("payment_id") REFERENCES "payments" ("payment_id");
ALTER TABLE "reports" ADD FOREIGN KEY ("admin_id") REFERENCES "users" ("user_id");
ALTER TABLE "reports" ADD FOREIGN KEY ("station_id") REFERENCES "stations" ("station_id");
ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
ALTER TABLE "feedbacks" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
ALTER TABLE "feedbacks" ADD FOREIGN KEY ("station_id") REFERENCES "stations" ("station_id");
ALTER TABLE "maintenances" ADD FOREIGN KEY ("station_id") REFERENCES "stations" ("station_id");
ALTER TABLE "maintenances" ADD FOREIGN KEY ("point_id") REFERENCES "charging_points" ("point_id");
ALTER TABLE "maintenances" ADD FOREIGN KEY ("reported_by") REFERENCES "users" ("user_id");
ALTER TABLE "maintenances" ADD FOREIGN KEY ("assigned_to") REFERENCES "users" ("user_id");
ALTER TABLE "audit_logs" ADD FOREIGN KEY ("actor_user_id") REFERENCES "users" ("user_id");

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stations_updated_at 
    BEFORE UPDATE ON stations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charging_points_updated_at 
    BEFORE UPDATE ON charging_points 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Simple function to find nearby stations (without PostGIS)
CREATE OR REPLACE FUNCTION find_nearby_stations(
    lat DOUBLE PRECISION, 
    lng DOUBLE PRECISION, 
    radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE(
    station_id INT,
    name VARCHAR,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    distance_km DOUBLE PRECISION,
    available_points BIGINT,
    total_points INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.station_id,
        s.name,
        s.address,
        s.latitude,
        s.longitude,
        -- Simple distance calculation (approximate)
        SQRT(POWER((s.latitude::float - lat) * 111.32, 2) + 
             POWER((s.longitude::float - lng) * 111.32 * COS(RADIANS(lat)), 2)) as distance_km,
        COUNT(cp.point_id) FILTER (WHERE cp.status = 'Available') as available_points,
        s.total_points
    FROM stations s
    LEFT JOIN charging_points cp ON s.station_id = cp.station_id
    WHERE s.status = 'Available'
    AND SQRT(POWER((s.latitude::float - lat) * 111.32, 2) + 
             POWER((s.longitude::float - lng) * 111.32 * COS(RADIANS(lat)), 2)) <= radius_km
    GROUP BY s.station_id, s.name, s.address, s.latitude, s.longitude, s.total_points
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;