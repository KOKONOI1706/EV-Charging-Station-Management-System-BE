-- Migration: Add password field to users table
-- Execute this in Supabase SQL Editor

-- Add password column to users table
ALTER TABLE "users" 
ADD COLUMN "password_hash" varchar(255);

-- Create index on password_hash for better performance
CREATE INDEX idx_users_password ON "users" ("password_hash");

-- Add comment to explain the column
COMMENT ON COLUMN "users"."password_hash" IS 'Bcrypt hashed password for user authentication';
