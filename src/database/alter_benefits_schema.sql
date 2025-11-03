-- Cập nhật schema benefits với các quyền lợi mới
ALTER TABLE service_packages
ALTER COLUMN benefits SET DEFAULT '{
  "label": "",
  "features": [],
  "max_sessions": null,
  "discount_rate": 0,
  "charging_speed": "",
  "priority_support": false,
  "bonus_minutes": 0,
  "after_limit_discount": false,
  "reward_points": 0,
  "free_start_fee": false,
  "booking_priority": false,
  "support_24_7": false,
  "energy_tracking": false
}'::jsonb;

-- Cập nhật các gói dịch vụ hiện có với giá trị mặc định cho các quyền lợi mới
UPDATE service_packages
SET benefits = benefits || '{
  "bonus_minutes": 0,
  "after_limit_discount": false,
  "reward_points": 0,
  "free_start_fee": false,
  "booking_priority": false,
  "support_24_7": false,
  "energy_tracking": false
}'::jsonb
WHERE benefits IS NOT NULL;