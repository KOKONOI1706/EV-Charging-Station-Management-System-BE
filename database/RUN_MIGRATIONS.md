# Run Database Migrations

## Bước 1: Kết nối Supabase SQL Editor

1. Mở Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Click **SQL Editor** ở sidebar bên trái

## Bước 2: Chạy Battery Tracking Migration

Copy toàn bộ nội dung file `add_battery_tracking_fields.sql` và paste vào SQL Editor, sau đó click **Run**.

```sql
-- Hoặc chạy trực tiếp:
ALTER TABLE charging_sessions
ADD COLUMN IF NOT EXISTS initial_battery_percent NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS target_battery_percent NUMERIC(5, 2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS estimated_completion_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS battery_full_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS idle_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_stopped BOOLEAN DEFAULT FALSE;
```

## Bước 3: Verify

Chạy query này để xác nhận columns đã được tạo:

```sql
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
```

Kết quả mong đợi: 6 rows

## Bước 4: Test

Sau khi migration thành công:
1. Restart backend (nếu đang chạy)
2. Tạo charging session mới với battery info
3. Kiểm tra log backend - phải thấy `initial_battery_percent: 1` (không phải null)

