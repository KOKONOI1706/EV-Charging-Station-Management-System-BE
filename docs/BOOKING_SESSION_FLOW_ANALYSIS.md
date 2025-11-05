# Booking & Charging Session Flow Analysis

## ✅ Database Schema Review - CORRECT STRUCTURE

### **1. Bookings Table**
```sql
bookings (
  booking_id PK,
  user_id FK → users,
  point_id FK → charging_points,  ✅ Books specific charging point
  start_time,
  expire_time,
  status DEFAULT 'Pending',
  price_estimate
)
```

**Status Flow:**
- `Pending` → Created, waiting confirmation
- `Confirmed` → Ready to use
- `Active` → Session in progress (NEW)
- `Completed` → Session finished
- `Canceled` → User canceled
- `Expired` → Time passed without use

---

### **2. Charging Sessions Table**
```sql
charging_sessions (
  session_id PK,
  user_id FK → users,
  vehicle_id FK → vehicles,
  point_id FK → charging_points,  ✅ Which point is being used
  booking_id FK → bookings,       ✅ Optional - for reserved sessions
  
  -- Session data
  start_time, end_time,
  meter_start, meter_end,
  energy_consumed_kwh,
  
  -- Smart battery tracking (NEW)
  initial_battery_percent,
  target_battery_percent,
  estimated_completion_time,
  battery_full_time,
  
  -- Idle management (NEW)
  idle_start_time,
  idle_minutes,
  idle_fee,
  auto_stopped,
  
  status DEFAULT 'Active'
)
```

---

### **3. Charging Points Table**
```sql
charging_points (
  point_id PK,
  station_id FK → stations,  ✅ Belongs to station
  name,
  status,  -- Available, In Use, Maintenance, Offline
  power_kw,
  price_rate,
  idle_fee_per_min  ✅ For idle fee calculation
)
```

---

## 🔄 Complete Flow Scenarios

### **Scenario 1: Pre-booked Session**

```
Step 1: Create Booking
─────────────────────────
POST /api/bookings
{
  user_id: 16,
  point_id: 5,
  start_time: "2025-01-05T10:00:00Z",
  expire_time: "2025-01-05T11:00:00Z"
}

✅ Creates:
  bookings.booking_id = 123
  bookings.status = "Pending"
  bookings.point_id = 5


Step 2: Confirm Booking
─────────────────────────
PUT /api/bookings/123/confirm

✅ Updates:
  bookings.status = "Confirmed"
  bookings.confirmed_at = NOW()


Step 3: User Arrives, Input Battery %
─────────────────────────────────────
[Frontend shows BatteryInputModal]
User inputs:
  - Current battery: 45%
  - Target battery: 80%
  
Calculate:
  - Energy needed: 35 kWh
  - Time estimate: 6 minutes (350kW charger)


Step 4: Start Charging Session
─────────────────────────────────
POST /api/charging-sessions
{
  user_id: 16,
  vehicle_id: 8,
  point_id: 5,
  booking_id: 123,  ← Links to booking
  meter_start: 100.5,
  initial_battery_percent: 45,
  target_battery_percent: 80
}

✅ Creates:
  charging_sessions.session_id = 97
  charging_sessions.status = "Active"
  charging_sessions.estimated_completion_time = NOW() + 6 min

✅ Updates:
  charging_points.status = "In Use"
  bookings.status = "Active"  ← NEW FIX


Step 5: Charging in Progress
─────────────────────────────
GET /api/charging-sessions/active/user/16
[Every 5 seconds]

Backend calculates:
  - current_battery_percent: 45 + (energy / capacity × 100)
  - time_to_target_minutes: remaining minutes
  - battery_status: 'charging' | 'near_full' | 'full'

Frontend shows:
  - Real-time battery %
  - Time remaining
  - Cost estimate


Step 6a: Battery Near Full (90%)
──────────────────────────────────
🟡 Warning: "Sắp đầy pin! Còn 2 phút"


Step 6b: Battery Full (80%)
─────────────────────────────
✅ Backend marks:
  charging_sessions.battery_full_time = NOW()

🟠 Warning: "Pin đã đầy! Vui lòng dừng sạc trong 5 phút"
Grace period countdown: 5:00, 4:59, 4:58...


Step 7a: User Stops Within Grace (✅ Good)
────────────────────────────────────────
PUT /api/charging-sessions/97/stop
{
  meter_end: 135.5,
  idle_minutes: 0
}

✅ Updates:
  charging_sessions.status = "Completed"
  charging_sessions.end_time = NOW()
  charging_sessions.idle_fee = 0
  
  charging_points.status = "Available"
  bookings.status = "Completed"

→ User goes to payment (no idle fee)


Step 7b: User Doesn't Stop (❌ Idle)
──────────────────────────────────
After 5 minutes grace period:

✅ Backend marks:
  charging_sessions.idle_start_time = NOW()

🔴 Warning: "Đang tính phí đậu xe! 1,000₫/phút"

Idle fee accumulates...


Step 8: Auto-Stop After 15 min Total
──────────────────────────────────
[Background job runs every minute]

After 5 min grace + 10 min idle = 15 min:

✅ Backend auto-stops:
  charging_sessions.status = "Completed"
  charging_sessions.auto_stopped = TRUE
  charging_sessions.idle_minutes = 10
  charging_sessions.idle_fee = 10,000₫
  charging_sessions.cost = energy_cost + idle_fee
  
  charging_points.status = "Available"
  bookings.status = "Completed"

🔔 Notification sent to user
→ Payment required
```

---

### **Scenario 2: Walk-in (No Booking)**

```
Step 1: User Arrives at Station
────────────────────────────────
[Check point availability]
GET /api/charging-points?station_id=abc&status=Available


Step 2: Select Available Point
────────────────────────────────
User selects point_id = 5


Step 3: Input Battery % & Start
────────────────────────────────
[Same as Scenario 1, Step 3-4]
POST /api/charging-sessions
{
  user_id: 16,
  vehicle_id: 8,
  point_id: 5,
  booking_id: null,  ← No booking (walk-in)
  meter_start: 100.5,
  initial_battery_percent: 45,
  target_battery_percent: 80
}

✅ Creates session without booking
✅ Updates charging_points.status = "In Use"
✅ No booking to update


Step 4-8: Same as Scenario 1
```

---

## ⚠️ Issues Fixed

### **Issue 1: Booking Status Not Updated ✅ FIXED**
**Problem**: When session starts with booking, booking status remained "Confirmed"

**Fix**: Added logic to update booking status to "Active"
```javascript
if (booking_id) {
  await supabase
    .from('bookings')
    .update({ status: 'Active' })
    .eq('booking_id', booking_id);
}
```

### **Issue 2: Battery Tracking Missing ✅ FIXED**
**Problem**: No way to track initial battery % or calculate accurate completion time

**Fix**: Added fields to charging_sessions:
- `initial_battery_percent`
- `target_battery_percent`
- `estimated_completion_time`
- `battery_full_time`
- `idle_start_time`
- `auto_stopped`

### **Issue 3: Idle Fee Not Enforced ✅ PENDING**
**Problem**: Sessions could stay connected indefinitely without penalty

**Fix**: 
- Grace period: 5 minutes after battery full (no fee)
- Idle period: After grace, charge 1,000₫/min
- Auto-stop: After 15 min total (5 grace + 10 idle)
- Background job to monitor and auto-stop

---

## ✅ Validation Checklist

### **Database Schema**
- [x] Bookings table has `point_id` (not `station_id`)
- [x] Charging sessions has `booking_id` (optional FK)
- [x] Charging sessions has `point_id` (required FK)
- [x] Charging points has `station_id` (belongs to station)
- [x] Charging sessions has battery tracking fields
- [x] Charging points has `idle_fee_per_min`

### **Backend Logic**
- [x] Start session accepts `initial_battery_percent`
- [x] Start session calculates `estimated_completion_time`
- [x] Start session updates `charging_points.status = "In Use"`
- [x] Start session updates `bookings.status = "Active"` (if booking exists)
- [x] Stop session updates `charging_points.status = "Available"`
- [ ] Stop session updates `bookings.status = "Completed"` (EXISTS)
- [ ] Active session API returns battery status
- [ ] Background job monitors for auto-stop

### **Frontend Flow**
- [x] BatteryInputModal component created
- [ ] Modal integrated into start session flow
- [ ] Real-time warnings displayed (90%, 95%, 100%)
- [ ] Grace period countdown shown
- [ ] Idle fee counter displayed

---

## 📊 Database Relationships (Validated)

```
users (1) ──────┬──────→ (N) bookings
                ├──────→ (N) charging_sessions
                └──────→ (N) vehicles

stations (1) ──→ (N) charging_points

charging_points (1) ──→ (N) bookings
                       └──→ (N) charging_sessions

bookings (1) ──→ (N) charging_sessions

vehicles (1) ──→ (N) charging_sessions
```

**✅ All relationships are correct!**

---

## 🚀 Next Steps

1. **Run Database Migration** 🔧
   ```sql
   -- File: database/add_battery_tracking_fields.sql
   ALTER TABLE charging_sessions ADD COLUMN ...
   ```

2. **Test Booking Flow** 🧪
   - Create booking
   - Start session with booking_id
   - Verify booking status updates

3. **Test Walk-in Flow** 🧪
   - Start session without booking_id
   - Verify point status updates

4. **Implement Auto-stop Job** ⏰
   - Install node-cron
   - Create autoStopService.js
   - Monitor idle sessions

5. **Test End-to-End** 🎯
   - Full cycle: Book → Start → Charge → Stop → Pay
   - Walk-in: Start → Charge → Stop → Pay
   - Idle scenario: Start → Full → Wait → Auto-stop

---

**Summary**: Database schema và flow logic đã **ĐÚNG** ✅
Chỉ cần implement các phần còn lại theo SMART_BATTERY_MONITORING.md
