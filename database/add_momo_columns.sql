-- Add MoMo payment columns to payments table
-- Run this SQL in your Supabase SQL Editor

-- Add missing columns for charging session payments and MoMo
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES charging_sessions(session_id),
ADD COLUMN IF NOT EXISTS order_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_url TEXT,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
ADD COLUMN IF NOT EXISTS momo_request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS momo_signature VARCHAR(512),
ADD COLUMN IF NOT EXISTS momo_response JSONB,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'momo',
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_momo_request_id ON payments(momo_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Update schema comments
COMMENT ON COLUMN payments.session_id IS 'Foreign key to charging_sessions table';
COMMENT ON COLUMN payments.order_id IS 'Unique order ID (format: EV_{session_id}_{timestamp})';
COMMENT ON COLUMN payments.payment_url IS 'Payment gateway URL for user to complete payment';
COMMENT ON COLUMN payments.qr_code_url IS 'QR code URL for e-wallet payments';
COMMENT ON COLUMN payments.momo_request_id IS 'MoMo unique request ID';
COMMENT ON COLUMN payments.momo_signature IS 'MoMo HMAC SHA256 signature';
COMMENT ON COLUMN payments.momo_response IS 'Full MoMo API response data';
COMMENT ON COLUMN payments.payment_method IS 'Payment method used (momo, vnpay, zalopay, card)';
COMMENT ON COLUMN payments.transaction_id IS 'Payment gateway transaction ID';
COMMENT ON COLUMN payments.paid_at IS 'Timestamp when payment was completed';
