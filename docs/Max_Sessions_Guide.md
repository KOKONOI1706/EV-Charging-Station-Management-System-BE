# Max Sessions - Giới Hạn Phiên Sạc

## 📊 Tổng Quan

`max_sessions` là số phiên sạc tối đa mà user được hưởng quyền lợi trong chu kỳ gói (thường là 1 tháng).

## 🎯 Cách Hoạt Động

### Scenario 1: Premium Plan (max_sessions: 25, after_limit_discount: false)

```json
{
  "name": "Premium Plan",
  "price": 299000,
  "duration_days": 30,
  "benefits": {
    "discount_rate": 10,
    "max_sessions": 25,
    "after_limit_discount": false
  }
}
```

**User A mua gói ngày 15/11/2025:**

```
📅 Chu kỳ gói: 15/11/2025 → 15/12/2025 (30 ngày)
🔢 Giới hạn: 25 phiên có giảm giá 10%
```

**Timeline sử dụng:**

| Ngày  | Phiên   | Sessions Used | Discount  | Giá gốc     | Giá trả     |
| ----- | ------- | ------------- | --------- | ----------- | ----------- |
| 16/11 | #1      | 1/25          | 10%       | 100,000     | 90,000      |
| 17/11 | #2      | 2/25          | 10%       | 120,000     | 108,000     |
| ...   | ...     | ...           | ...       | ...         | ...         |
| 05/12 | #24     | 24/25         | 10%       | 110,000     | 99,000      |
| 06/12 | #25     | 25/25         | 10% ✅    | 100,000     | 90,000      |
| 07/12 | **#26** | **26/25**     | **0%** ❌ | **100,000** | **100,000** |
| 08/12 | #27     | 27/25         | 0% ❌     | 150,000     | 150,000     |
| ...   | ...     | ...           | 0% ❌     | ...         | ...         |

**Warning hiển thị:**

```
Phiên #24: ⚠️ "Còn 1 phiên có giảm giá"
Phiên #25: ⚠️ "Đây là phiên cuối có giảm giá"
Phiên #26: ❌ "Bạn đã sử dụng hết 25 phiên trong tháng này.
             Giảm giá không còn hiệu lực cho các phiên tiếp theo."
```

---

### Scenario 2: VIP Plan (max_sessions: 50, after_limit_discount: true)

```json
{
  "name": "VIP Plan",
  "price": 599000,
  "duration_days": 30,
  "benefits": {
    "discount_rate": 20,
    "max_sessions": 50,
    "after_limit_discount": true
  }
}
```

**User B mua gói ngày 15/11/2025:**

```
📅 Chu kỳ gói: 15/11/2025 → 15/12/2025 (30 ngày)
🔢 Giới hạn: 50 phiên với giảm giá 20%
✨ Sau giới hạn: Vẫn được giảm 10% (50% của discount gốc)
```

**Timeline sử dụng:**

| Ngày  | Phiên   | Sessions Used | Discount   | Giá gốc     | Giá trả    | Note               |
| ----- | ------- | ------------- | ---------- | ----------- | ---------- | ------------------ |
| 16/11 | #1      | 1/50          | 20%        | 100,000     | 80,000     | Full discount      |
| ...   | ...     | ...           | 20%        | ...         | ...        | ...                |
| 10/12 | #49     | 49/50         | 20%        | 100,000     | 80,000     | ⚠️ Còn 1 phiên     |
| 11/12 | #50     | 50/50         | 20% ✅     | 100,000     | 80,000     | Last full discount |
| 12/12 | **#51** | **51/50**     | **10%** ⚡ | **100,000** | **90,000** | Reduced discount   |
| 13/12 | #52     | 52/50         | 10% ⚡     | 150,000     | 135,000    | Still discounted   |
| ...   | ...     | ...           | 10% ⚡     | ...         | ...        | ...                |

**Warning hiển thị:**

```
Phiên #49: ⚠️ "Còn 1 phiên với giảm giá 20%"
Phiên #50: ⚠️ "Đây là phiên cuối với giảm giá 20%"
Phiên #51: ⚡ "Bạn đã vượt giới hạn 50 phiên/tháng.
             Giảm giá còn 10% (từ 20%)"
```

---

## 🔄 API Flow

### 1. Check Session Limit

```javascript
// GET /api/benefits/session-limit/:userId

Response:
{
  "success": true,
  "data": {
    "has_active_package": true,
    "has_limit": true,
    "package_name": "Premium Plan",
    "start_date": "2025-11-15T14:30:00Z",
    "end_date": "2025-12-15T14:30:00Z",
    "sessions_used": 24,
    "sessions_limit": 25,
    "sessions_remaining": 1,
    "limit_exceeded": false,
    "after_limit_discount": false,
    "discount_rate_after_limit": 0
  },
  "message": "1 sessions remaining out of 25"
}
```

### 2. Calculate Price with Limit Check

```javascript
// POST /api/benefits/calculate-discount

Request:
{
  "user_id": 14,
  "original_price": 100000
}

Response (Before limit):
{
  "success": true,
  "data": {
    "original_price": 100000,
    "discounted_price": 90000,
    "discount_rate": 10,
    "savings": 10000,
    "session_limit_info": {
      "sessions_used": 24,
      "sessions_limit": 25,
      "sessions_remaining": 1,
      "limit_exceeded": false,
      "message": "Còn 1/25 phiên có giảm giá"
    }
  }
}

Response (After limit, no after_limit_discount):
{
  "success": true,
  "data": {
    "original_price": 100000,
    "discounted_price": 100000,
    "discount_rate": 0,
    "savings": 0,
    "session_limit_info": {
      "sessions_used": 26,
      "sessions_limit": 25,
      "sessions_remaining": 0,
      "limit_exceeded": true,
      "message": "Bạn đã sử dụng hết 25 phiên trong tháng này.
                  Giảm giá không còn hiệu lực cho các phiên tiếp theo."
    }
  }
}

Response (After limit, with after_limit_discount):
{
  "success": true,
  "data": {
    "original_price": 100000,
    "discounted_price": 90000,
    "discount_rate": 10,  // Reduced from 20%
    "savings": 10000,
    "session_limit_info": {
      "sessions_used": 51,
      "sessions_limit": 50,
      "sessions_remaining": 0,
      "limit_exceeded": true,
      "message": "Bạn đã vượt giới hạn 50 phiên/tháng.
                  Giảm giá còn 10% (từ 20%)"
    }
  }
}
```

---

## 💻 Implementation Code

### Backend - Check limit before charging

```javascript
// In chargingSessionController.js

const startChargingSession = async (req, res) => {
  const { user_id, point_id, vehicle_id } = req.body;

  // Check session limit
  const sessionLimit = await checkSessionLimit(user_id);

  let warningMessage = null;

  if (sessionLimit.has_limit) {
    if (sessionLimit.limit_exceeded) {
      if (sessionLimit.after_limit_discount) {
        warningMessage =
          `⚡ Bạn đã vượt giới hạn ${sessionLimit.sessions_limit} phiên. ` +
          `Giảm giá còn ${sessionLimit.discount_rate_after_limit}%`;
      } else {
        warningMessage =
          `❌ Bạn đã sử dụng hết ${sessionLimit.sessions_limit} phiên có giảm giá. ` +
          `Phiên này sẽ tính giá đầy đủ.`;
      }
    } else if (sessionLimit.sessions_remaining <= 3) {
      warningMessage = `⚠️ Còn ${sessionLimit.sessions_remaining} phiên có giảm giá trong tháng này`;
    }
  }

  // Create session...
  const session = await createSession({ user_id, point_id, vehicle_id });

  return res.json({
    success: true,
    data: session,
    warning: warningMessage,
  });
};
```

### Frontend - Display warning

```typescript
// In StartChargingModal.tsx

const checkSessionLimit = async () => {
  const response = await fetch(`/api/benefits/session-limit/${userId}`);
  const { data } = await response.json();

  if (data.has_limit && data.limit_exceeded) {
    if (data.after_limit_discount) {
      toast.warning(
        `Bạn đã vượt ${data.sessions_limit} phiên. ` +
          `Giảm giá còn ${data.discount_rate_after_limit}%`,
        { duration: 5000 }
      );
    } else {
      toast.error(
        `Bạn đã hết quota ${data.sessions_limit} phiên có giảm giá. ` +
          `Phiên này tính giá đầy đủ.`,
        { duration: 5000 }
      );
    }
  } else if (data.has_limit && data.sessions_remaining <= 3) {
    toast.info(
      `⚠️ Còn ${data.sessions_remaining}/${data.sessions_limit} phiên có giảm giá`,
      { duration: 3000 }
    );
  }
};

// Call before starting session
useEffect(() => {
  checkSessionLimit();
}, [userId]);
```

### Dashboard - Display usage stats

```tsx
// SessionUsageCard.tsx
const SessionUsageCard = ({ userId }) => {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetch(`/api/benefits/session-limit/${userId}`)
      .then((res) => res.json())
      .then((data) => setUsage(data.data));
  }, [userId]);

  if (!usage?.has_limit) return null;

  const percentage = (usage.sessions_used / usage.sessions_limit) * 100;

  return (
    <Card>
      <h3>📊 Phiên Sạc Trong Tháng</h3>

      <ProgressBar
        value={percentage}
        max={100}
        color={
          percentage >= 100 ? "red" : percentage >= 80 ? "orange" : "green"
        }
      />

      <div className="stats">
        <p>
          Đã dùng: {usage.sessions_used}/{usage.sessions_limit}
        </p>
        <p>Còn lại: {usage.sessions_remaining} phiên</p>
      </div>

      {usage.limit_exceeded && (
        <Alert variant={usage.after_limit_discount ? "warning" : "error"}>
          {usage.after_limit_discount ? (
            <>
              ⚡ Vượt giới hạn - Giảm giá còn {usage.discount_rate_after_limit}%
            </>
          ) : (
            <>❌ Đã hết quota giảm giá</>
          )}
        </Alert>
      )}
    </Card>
  );
};
```

---

## 📈 Benefits So Sánh

### Premium (max_sessions: 25, no after_limit_discount)

```
Tổng chi phí cho 30 phiên trong tháng:
- Phiên 1-25:  25 × 90,000  = 2,250,000 VND (có giảm giá)
- Phiên 26-30:  5 × 100,000 =   500,000 VND (không giảm)
-----------------------------------------
Tổng:                        = 2,750,000 VND

So với Basic user (30 × 100,000):        = 3,000,000 VND
Tiết kiệm:                              =   250,000 VND
```

### VIP (max_sessions: 50, with after_limit_discount)

```
Tổng chi phí cho 55 phiên trong tháng:
- Phiên 1-50:  50 × 80,000  = 4,000,000 VND (giảm 20%)
- Phiên 51-55:  5 × 90,000  =   450,000 VND (giảm 10%)
-----------------------------------------
Tổng:                        = 4,450,000 VND

So với Basic user (55 × 100,000):        = 5,500,000 VND
Tiết kiệm:                              = 1,050,000 VND
```

---

## 🔔 Notifications

**Email khi gần hết quota (sessions_remaining <= 5):**

```
Subject: ⚠️ Sắp hết quota phiên sạc có giảm giá

Xin chào [User Name],

Bạn còn 3 phiên sạc có giảm giá 10% trong gói Premium Plan.

Đã dùng: 22/25 phiên
Còn lại: 3 phiên
Chu kỳ: 15/11/2025 - 15/12/2025

Sau khi hết quota, các phiên sạc sẽ tính giá đầy đủ.

Trân trọng,
EV Charging Team
```

---

## 🎯 Use Cases

### 1. Heavy User (30+ sessions/month)

→ Nên chọn VIP Plan với max_sessions: 50 + after_limit_discount

### 2. Moderate User (15-25 sessions/month)

→ Nên chọn Premium Plan với max_sessions: 25

### 3. Light User (< 10 sessions/month)

→ Basic Plan (unlimited sessions nhưng không giảm giá)

---

## 📊 Analytics

Admin có thể track:

- Average sessions per user per package
- % users vượt max_sessions
- Revenue impact of after_limit_discount

```sql
-- Query để phân tích
SELECT
  up.package_id,
  sp.name,
  sp.benefits->>'max_sessions' as max_sessions,
  COUNT(DISTINCT cs.user_id) as total_users,
  COUNT(cs.session_id) as total_sessions,
  AVG(sessions_count) as avg_sessions_per_user,
  COUNT(CASE WHEN sessions_count > (sp.benefits->>'max_sessions')::int
        THEN 1 END) as users_exceeded_limit
FROM user_packages up
JOIN service_packages sp ON up.package_id = sp.package_id
JOIN (
  SELECT user_id, COUNT(*) as sessions_count
  FROM charging_sessions
  GROUP BY user_id
) cs ON up.user_id = cs.user_id
WHERE up.status = 'Active'
GROUP BY up.package_id, sp.name, sp.benefits->>'max_sessions';
```

Như vậy `max_sessions` giúp control costs và encourage users upgrade to higher tier packages!
