# Package Benefits System

## Tổng quan

Hệ thống tự động áp dụng quyền lợi của gói dịch vụ ngay sau khi user mua gói thành công.

## Các loại quyền lợi

### 1. **Discount Rate** (Giảm giá %)

- Tự động áp dụng % giảm giá cho mọi phiên sạc
- Ví dụ: 10% discount → Phiên sạc 100,000 VND chỉ còn 90,000 VND

### 2. **Bonus Minutes** (Phút miễn phí)

- Miễn phí idle fee trong X phút đầu tiên
- Ví dụ: 30 bonus minutes → Không tính idle fee trong 30 phút đầu

### 3. **Reward Points** (Điểm thưởng)

- Nhận điểm thưởng khi kích hoạt gói
- Có thể dùng để đổi quà hoặc giảm giá

### 4. **Priority Support** (Hỗ trợ ưu tiên)

- Được ưu tiên khi liên hệ support
- Thời gian phản hồi nhanh hơn

### 5. **24/7 Support** (Hỗ trợ 24/7)

- Được hỗ trợ mọi lúc, kể cả ngoài giờ hành chính

### 6. **Booking Priority** (Ưu tiên đặt chỗ)

- Được ưu tiên khi đặt chỗ sạc
- Tránh trường hợp hết chỗ

### 7. **Free Start Fee** (Miễn phí khởi động)

- Không tính phí khởi động phiên sạc
- Thường áp dụng cho các gói VIP

### 8. **Energy Tracking** (Theo dõi năng lượng)

- Xem chi tiết năng lượng tiêu thụ
- Biểu đồ phân tích chi tiết

### 9. **Max Sessions** (Giới hạn phiên sạc)

- Giới hạn số phiên sạc/tháng
- Ví dụ: 10 sessions/month

### 10. **After Limit Discount** (Giảm giá sau giới hạn)

- Vẫn được giảm giá khi vượt giới hạn phiên sạc

## Cấu trúc Benefits trong Database

```json
{
  "label": "Premium Features",
  "features": ["Fast charging", "Priority booking"],
  "max_sessions": 50,
  "discount_rate": 10,
  "charging_speed": "Ultra Fast",
  "priority_support": true,
  "bonus_minutes": 30,
  "after_limit_discount": false,
  "reward_points": 1000,
  "free_start_fee": false,
  "booking_priority": true,
  "support_24_7": false,
  "energy_tracking": true
}
```

## API Endpoints

### 1. Get Active Benefits

```
GET /api/benefits/active/:userId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "has_active_package": true,
    "package_name": "Premium Plan",
    "total_packages": 1,
    "benefits": [
      {
        "type": "discount_rate",
        "value": 10,
        "description": "10% giảm giá cho mọi phiên sạc"
      },
      {
        "type": "bonus_minutes",
        "value": 30,
        "description": "30 phút miễn phí idle fee"
      }
    ],
    "aggregated": {
      "discount_rate": 10,
      "bonus_minutes": 30,
      "reward_points": 1000
    }
  }
}
```

### 2. Calculate Discounted Price

```
POST /api/benefits/calculate-discount
```

**Request:**

```json
{
  "user_id": 14,
  "original_price": 100000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "original_price": 100000,
    "discounted_price": 90000,
    "discount_rate": 10,
    "savings": 10000
  },
  "message": "You save 10000 VND (10% off)"
}
```

## Workflow

### 1. User mua gói

```
POST /api/payments/momo/create (package_id, amount, extraData)
→ MoMo payment page
→ User completes payment
→ Callback to /payment/callback
```

### 2. Callback xử lý

```
PaymentCallback component:
→ Parse extraData (detect package_id)
→ Verify payment status
→ Get actual payment_id from order_id
→ Call POST /api/purchase
```

### 3. Backend activate package & apply benefits

```
purchaseService.purchasePackage():
→ Fetch package data (includes benefits)
→ Create payment record (if needed)
→ Create user_package record
→ Call applyPackageBenefits()
→ Store applied_benefits in user_packages table
```

### 4. Benefits applied

```
benefitsService.applyPackageBenefits():
→ Parse each benefit type
→ Log applied benefits
→ Update user_packages.applied_benefits
→ Set benefits_applied_at timestamp
```

## Database Schema Changes

Run this migration to add benefits tracking:

```sql
-- database/add_benefits_tracking.sql
ALTER TABLE user_packages
ADD COLUMN IF NOT EXISTS applied_benefits JSONB,
ADD COLUMN IF NOT EXISTS benefits_applied_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_user_packages_benefits_applied
ON user_packages(benefits_applied_at);
```

## Frontend Integration

### 1. Hiển thị benefits trên Pricing Page

```tsx
// Fetch benefits khi load package
const benefits = packageData.benefits;

// Display each benefit
{
  benefits.discount_rate && <div>💰 {benefits.discount_rate}% discount</div>;
}
```

### 2. Áp dụng discount khi thanh toán

```tsx
// Fetch user's active benefits
const response = await fetch(`/api/benefits/active/${userId}`);
const { data } = await response.json();

// Calculate discounted price
const discountInfo = await fetch("/api/benefits/calculate-discount", {
  method: "POST",
  body: JSON.stringify({ user_id: userId, original_price: 100000 }),
});
```

### 3. Hiển thị benefits trong Profile/Dashboard

```tsx
// Show active benefits
<BenefitsCard>
  {activeBenefits.benefits.map((benefit) => (
    <BenefitItem key={benefit.type}>{benefit.description}</BenefitItem>
  ))}
</BenefitsCard>
```

## Testing

### Test scenario 1: Mua Premium Plan

```
1. User mua Premium Plan (10% discount)
2. Check console logs: "Applied 1 benefits for package Premium Plan"
3. Query database: SELECT applied_benefits FROM user_packages WHERE user_id = ?
4. Expected: [{"type": "discount_rate", "value": 10, ...}]
```

### Test scenario 2: Tính giá có discount

```
1. User có Premium Plan active
2. Call /api/benefits/calculate-discount với original_price = 100000
3. Expected response: discounted_price = 90000, savings = 10000
```

### Test scenario 3: Multiple benefits

```
1. User mua VIP Plan (20% discount + bonus minutes + priority support)
2. Check applied_benefits có 3 items
3. Verify mỗi benefit type có đúng value
```

## Notes

- Benefits được apply **ngay sau khi** user_package được tạo
- Nếu apply benefits fail, package vẫn được activate (không rollback)
- Multiple active packages → aggregate benefits (lấy max discount_rate, sum bonus_minutes)
- Benefits expire cùng với package (end_date)

## Future Enhancements

1. **Auto-apply discount trong charging session**

   - Check active benefits trước khi tính cost
   - Tự động trừ discount_rate

2. **Loyalty points system**

   - Tích điểm mỗi lần sạc
   - Đổi điểm lấy voucher

3. **Usage tracking**

   - Track số phiên sạc đã dùng vs max_sessions
   - Warning khi gần hết quota

4. **Benefit notifications**
   - Email thông báo khi activate benefits
   - Push notification khi có quyền lợi mới
