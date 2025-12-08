-- Add package_id column to payments table for package purchases
-- This allows payments to be associated with either a charging session OR a package purchase

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS package_id integer;

-- Add comment to explain the column
COMMENT ON COLUMN payments.package_id IS 'References service_packages.package_id for package purchase payments. NULL for charging session payments.';

-- Add foreign key constraint to service_packages
ALTER TABLE payments
ADD CONSTRAINT fk_payments_package
FOREIGN KEY (package_id) 
REFERENCES service_packages(package_id)
ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_package_id ON payments(package_id);

-- Also add session_id if it doesn't exist (for charging session payments)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS session_id integer;

COMMENT ON COLUMN payments.session_id IS 'References charging_sessions.session_id for charging session payments. NULL for package purchase payments.';

-- Add foreign key for session_id
ALTER TABLE payments
ADD CONSTRAINT fk_payments_session
FOREIGN KEY (session_id) 
REFERENCES charging_sessions(session_id)
ON DELETE SET NULL;

-- Add index for session lookups
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(session_id);

-- Add columns for MoMo payment integration
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS order_id varchar(255),
ADD COLUMN IF NOT EXISTS momo_request_id varchar(255),
ADD COLUMN IF NOT EXISTS momo_trans_id varchar(255),
ADD COLUMN IF NOT EXISTS payment_url text,
ADD COLUMN IF NOT EXISTS qr_code_url text,
ADD COLUMN IF NOT EXISTS paid_at timestamp,
ADD COLUMN IF NOT EXISTS failure_reason text,
ADD COLUMN IF NOT EXISTS momo_response jsonb,
ADD COLUMN IF NOT EXISTS momo_response_time varchar(100);

-- Add unique constraint on order_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Add comments for new columns
COMMENT ON COLUMN payments.order_id IS 'Unique order ID for MoMo payment tracking';
COMMENT ON COLUMN payments.momo_request_id IS 'MoMo request ID from payment creation';
COMMENT ON COLUMN payments.momo_trans_id IS 'MoMo transaction ID after payment completion';
COMMENT ON COLUMN payments.payment_url IS 'MoMo payment URL for user to complete payment';
COMMENT ON COLUMN payments.qr_code_url IS 'MoMo QR code URL for scanning';
COMMENT ON COLUMN payments.paid_at IS 'Timestamp when payment was completed';
COMMENT ON COLUMN payments.failure_reason IS 'Reason for payment failure';
COMMENT ON COLUMN payments.momo_response IS 'Full MoMo response JSON';

-- Update status enum to match code expectations
ALTER TABLE payments
ALTER COLUMN status TYPE varchar(50);

-- Add payment_method column if it doesn't exist
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method varchar(50) DEFAULT 'momo';

COMMENT ON COLUMN payments.payment_method IS 'Payment method: momo, vnpay, zalopay, etc.';

-- Show summary
SELECT 
    'Payments table structure updated successfully' as message,
    COUNT(*) as total_payments,
    COUNT(package_id) as package_payments,
    COUNT(session_id) as session_payments
FROM payments;
