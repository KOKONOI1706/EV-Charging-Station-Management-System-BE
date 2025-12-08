-- Add columns to track applied benefits in user_packages table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE user_packages 
ADD COLUMN IF NOT EXISTS applied_benefits JSONB,
ADD COLUMN IF NOT EXISTS benefits_applied_at TIMESTAMP;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_packages_benefits_applied ON user_packages(benefits_applied_at);

-- Add comments
COMMENT ON COLUMN user_packages.applied_benefits IS 'JSON array of applied benefits with type, value, and description';
COMMENT ON COLUMN user_packages.benefits_applied_at IS 'Timestamp when benefits were applied to user';
