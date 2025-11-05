-- Add battery tracking fields to charging_sessions table
-- This enables accurate battery level monitoring and idle fee calculation

-- Add new columns
ALTER TABLE charging_sessions
ADD COLUMN IF NOT EXISTS initial_battery_percent NUMERIC(5, 2),  -- Starting battery % (e.g., 45.50)
ADD COLUMN IF NOT EXISTS target_battery_percent NUMERIC(5, 2) DEFAULT 100.00,  -- Target % (usually 80 or 100)
ADD COLUMN IF NOT EXISTS estimated_completion_time TIMESTAMPTZ,  -- When charging should finish
ADD COLUMN IF NOT EXISTS battery_full_time TIMESTAMPTZ,  -- Actual time battery reached full
ADD COLUMN IF NOT EXISTS idle_start_time TIMESTAMPTZ,  -- When idle period started (after 5 min grace)
ADD COLUMN IF NOT EXISTS auto_stopped BOOLEAN DEFAULT FALSE;  -- Whether session was auto-stopped

-- Add comments for documentation
COMMENT ON COLUMN charging_sessions.initial_battery_percent IS 'Battery level at start of charging session (%)';
COMMENT ON COLUMN charging_sessions.target_battery_percent IS 'Desired battery level to charge to (%)';
COMMENT ON COLUMN charging_sessions.estimated_completion_time IS 'Estimated time when battery will reach target %';
COMMENT ON COLUMN charging_sessions.battery_full_time IS 'Timestamp when battery reached target % (for idle fee calculation)';
COMMENT ON COLUMN charging_sessions.idle_start_time IS 'When idle grace period ended (5 minutes after full)';
COMMENT ON COLUMN charging_sessions.auto_stopped IS 'Whether session was automatically stopped due to idle timeout';

-- Create index for querying sessions near completion
CREATE INDEX IF NOT EXISTS idx_sessions_estimated_completion 
ON charging_sessions(estimated_completion_time) 
WHERE status = 'Active';

-- Create index for idle monitoring
CREATE INDEX IF NOT EXISTS idx_sessions_battery_full 
ON charging_sessions(battery_full_time) 
WHERE status = 'Active' AND battery_full_time IS NOT NULL;

-- Verify changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'charging_sessions'
AND column_name IN (
    'initial_battery_percent',
    'target_battery_percent',
    'estimated_completion_time',
    'battery_full_time',
    'idle_start_time',
    'auto_stopped'
)
ORDER BY column_name;

-- Show success message
SELECT '✅ Battery tracking fields added successfully!' as status;
