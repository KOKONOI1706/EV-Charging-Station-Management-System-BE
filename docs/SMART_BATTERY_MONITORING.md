# Smart Battery Monitoring & Auto-stop Implementation Guide

## 📋 Overview
Hệ thống quản lý pin thông minh với tính năng:
1. ✅ Nhập % pin ban đầu khi bắt đầu sạc
2. ✅ Tính toán thời gian sạc dự kiến
3. 🔄 Cảnh báo khi pin sắp đầy (90%, 95%, 100%)
4. ⏰ Tự động dừng sạc sau 5 phút grace period
5. 💰 Tính phí đậu xe (idle fee) sau khi auto-stop

---

## ✅ COMPLETED

### Phase 1: Database Schema ✅
**File**: `database/add_battery_tracking_fields.sql`

```sql
ALTER TABLE charging_sessions
ADD COLUMN initial_battery_percent NUMERIC(5, 2),
ADD COLUMN target_battery_percent NUMERIC(5, 2) DEFAULT 100.00,
ADD COLUMN estimated_completion_time TIMESTAMPTZ,
ADD COLUMN battery_full_time TIMESTAMPTZ,
ADD COLUMN idle_start_time TIMESTAMPTZ,
ADD COLUMN auto_stopped BOOLEAN DEFAULT FALSE;
```

**Action**: Run trong Supabase SQL Editor

---

### Phase 2: Backend API ✅
**File**: `src/routes/chargingSessions.js`

**Changes**:
1. Accept `initial_battery_percent` và `target_battery_percent` trong POST request
2. Calculate `estimated_completion_time` based on:
   - Battery capacity (from vehicle)
   - Current battery %
   - Target battery %
   - Charging power (kW)

**Formula**:
```javascript
percentToCharge = target - initial
energyNeeded = (percentToCharge / 100) * batteryCapacity
hoursNeeded = energyNeeded / chargingPowerKw
estimatedCompletionTime = now + hoursNeeded
```

---

### Phase 3: Frontend Components ✅
**File**: `src/components/BatteryInputModal.tsx`

**Features**:
- Slider để chọn % pin (0-100%)
- Number input để nhập chính xác
- Target battery selection (80% / 100%)
- Real-time estimate display:
  - Năng lượng cần sạc (kWh)
  - Thời gian ước tính
  - Công suất sạc
- Validation: current < target

---

## 🔄 TODO - Phase 4: Real-time Monitoring

### A. Update Active Session API
**File**: `src/routes/chargingSessions.js`

**Endpoint**: `GET /api/charging-sessions/active/user/:userId`

**Add logic**:
```javascript
// Calculate current battery level
const currentBatteryPercent = 
  session.initial_battery_percent + 
  (energyConsumed / batteryCapacity) * 100;

// Determine battery status
let batteryStatus = 'charging';
let timeToTarget = null;

if (currentBatteryPercent >= session.target_battery_percent) {
  batteryStatus = 'full';
  
  // If just reached full, mark battery_full_time
  if (!session.battery_full_time) {
    await supabase
      .from('charging_sessions')
      .update({ battery_full_time: new Date().toISOString() })
      .eq('session_id', session.session_id);
  }
  
  // Calculate time since full
  const timeSinceFull = now - new Date(session.battery_full_time);
  const minutesSinceFull = timeSinceFull / (1000 * 60);
  
  // Start idle period after 5 minutes grace
  if (minutesSinceFull >= 5 && !session.idle_start_time) {
    await supabase
      .from('charging_sessions')
      .update({ idle_start_time: new Date().toISOString() })
      .eq('session_id', session.session_id);
  }
} else if (currentBatteryPercent >= session.target_battery_percent - 10) {
  batteryStatus = 'near_full'; // Within 10% of target
  
  // Calculate time remaining
  const percentRemaining = session.target_battery_percent - currentBatteryPercent;
  const energyRemaining = (percentRemaining / 100) * batteryCapacity;
  const hoursRemaining = energyRemaining / chargingPowerKw;
  timeToTarget = hoursRemaining * 60; // minutes
}

return {
  ...session,
  current_battery_percent: currentBatteryPercent,
  battery_status: batteryStatus,
  time_to_target_minutes: timeToTarget,
  grace_period_remaining: minutesSinceFull < 5 ? 5 - minutesSinceFull : 0
};
```

---

### B. Update Frontend - Active Charging Session
**File**: `src/components/ActiveChargingSession.tsx`

**Add warning alerts**:

```typescript
// Determine battery status
const batteryStatus = session.battery_status || 'charging';
const currentBatteryPercent = session.current_battery_percent || 0;
const targetBatteryPercent = session.target_battery_percent || 100;
const gracePeriodRemaining = session.grace_period_remaining || 0;

// Warning conditions
const isNearFull = batteryStatus === 'near_full'; // 90-99%
const isFull = batteryStatus === 'full'; // 100%
const isInGracePeriod = isFull && gracePeriodRemaining > 0;
const isInIdlePeriod = isFull && gracePeriodRemaining === 0;

// Render warnings
{isNearFull && (
  <Alert className="border-yellow-500 bg-yellow-50">
    <AlertCircle className="h-4 w-4 text-yellow-600" />
    <AlertDescription className="text-yellow-800">
      <strong>🔋 Sắp đầy pin!</strong> Còn khoảng {session.time_to_target_minutes} phút nữa sẽ đạt {targetBatteryPercent}%.
      Vui lòng chuẩn bị dừng sạc.
    </AlertDescription>
  </Alert>
)}

{isInGracePeriod && (
  <Alert className="border-orange-500 bg-orange-50 animate-pulse">
    <AlertCircle className="h-4 w-4 text-orange-600" />
    <AlertDescription className="text-orange-800">
      <strong>⚠️ Pin đã đầy!</strong> Vui lòng dừng sạc trong {Math.ceil(gracePeriodRemaining)} phút 
      để tránh phí đậu xe (idle fee).
    </AlertDescription>
  </Alert>
)}

{isInIdlePeriod && (
  <Alert className="border-red-500 bg-red-50">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertDescription className="text-red-800">
      <strong>🚨 Đang tính phí đậu xe!</strong> Pin đã đầy và grace period đã hết. 
      Phí đậu xe đang được tính. Vui lòng dừng sạc và thanh toán ngay.
    </AlertDescription>
  </Alert>
)}
```

---

### C. Background Job - Auto Stop Sessions
**File**: `src/services/autoStopService.js` (NEW)

**Purpose**: Tự động dừng sessions sau 15 phút idle (5 min grace + 10 min idle)

```javascript
import supabase from '../supabase/client.js';
import cron from 'node-cron';

// Run every minute
export function startAutoStopMonitoring() {
  cron.schedule('* * * * *', async () => {
    try {
      // Find sessions in idle period for > 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const { data: idleSessions } = await supabase
        .from('charging_sessions')
        .select('*')
        .eq('status', 'Active')
        .not('idle_start_time', 'is', null)
        .lt('idle_start_time', tenMinutesAgo.toISOString());
      
      if (!idleSessions || idleSessions.length === 0) return;
      
      console.log(`🤖 Auto-stopping ${idleSessions.length} idle sessions...`);
      
      for (const session of idleSessions) {
        // Calculate idle fee
        const idleStartTime = new Date(session.idle_start_time);
        const idleMinutes = (Date.now() - idleStartTime.getTime()) / (1000 * 60);
        const idleFeePerMin = 1000; // VND per minute
        const idleFee = Math.ceil(idleMinutes) * idleFeePerMin;
        
        // Auto-stop session
        await supabase
          .from('charging_sessions')
          .update({
            end_time: new Date().toISOString(),
            meter_end: session.meter_start + session.energy_consumed_kwh,
            status: 'Completed',
            auto_stopped: true,
            idle_fee: idleFee,
            cost: (session.cost || 0) + idleFee
          })
          .eq('session_id', session.session_id);
        
        console.log(`✅ Auto-stopped session ${session.session_id} with ${idleMinutes.toFixed(0)} min idle (${idleFee} VND fee)`);
        
        // TODO: Send notification to user
        // await sendNotification(session.user_id, {
        //   title: 'Phiên sạc đã tự động kết thúc',
        //   body: `Phiên sạc #${session.session_id} đã được tự động dừng sau ${Math.ceil(idleMinutes)} phút idle. Phí đậu xe: ${idleFee} VND`
        // });
      }
    } catch (error) {
      console.error('❌ Auto-stop error:', error);
    }
  });
  
  console.log('✅ Auto-stop monitoring started');
}
```

**Register in server.js**:
```javascript
import { startAutoStopMonitoring } from './services/autoStopService.js';

// After server starts
startAutoStopMonitoring();
```

---

## 📊 Database Queries for Monitoring

### Find sessions approaching full
```sql
SELECT 
    s.session_id,
    s.user_id,
    u.name,
    s.initial_battery_percent,
    s.target_battery_percent,
    s.estimated_completion_time,
    (s.estimated_completion_time - NOW()) as time_remaining
FROM charging_sessions s
JOIN users u ON s.user_id = u.user_id
WHERE s.status = 'Active'
AND s.estimated_completion_time IS NOT NULL
AND s.estimated_completion_time <= NOW() + INTERVAL '15 minutes'
ORDER BY s.estimated_completion_time;
```

### Find sessions in grace period
```sql
SELECT 
    s.session_id,
    s.battery_full_time,
    (NOW() - s.battery_full_time) as time_since_full,
    EXTRACT(EPOCH FROM (NOW() - s.battery_full_time)) / 60 as minutes_since_full
FROM charging_sessions s
WHERE s.status = 'Active'
AND s.battery_full_time IS NOT NULL
AND s.idle_start_time IS NULL
ORDER BY s.battery_full_time;
```

### Find sessions in idle period
```sql
SELECT 
    s.session_id,
    s.user_id,
    s.idle_start_time,
    EXTRACT(EPOCH FROM (NOW() - s.idle_start_time)) / 60 as idle_minutes
FROM charging_sessions s
WHERE s.status = 'Active'
AND s.idle_start_time IS NOT NULL
ORDER BY s.idle_start_time;
```

---

## 🎯 Implementation Checklist

- [x] Database schema updated
- [x] Backend API accepts battery %
- [x] Frontend BatteryInputModal created
- [ ] Update session start flow to show BatteryInputModal
- [ ] Backend real-time monitoring logic
- [ ] Frontend warning alerts
- [ ] Auto-stop background job
- [ ] Notification system (optional)
- [ ] Testing with different scenarios
- [ ] Documentation update

---

## 🧪 Testing Scenarios

1. **Normal charging (0% → 80%)**
   - Start: 20%, Target: 80%, Power: 350kW
   - Expected: ~10 minutes
   - Verify warnings at 70%, 75%, 78%

2. **Quick top-up (70% → 100%)**
   - Start: 70%, Target: 100%, Power: 150kW
   - Expected: ~12 minutes
   - Verify grace period triggers at 100%

3. **Idle scenario**
   - Reach 100% but don't stop
   - Verify grace period countdown (5 min)
   - Verify idle fee starts after 5 min
   - Verify auto-stop after 15 min total

4. **Edge cases**
   - Start at 99%, target 100%
   - Start at 5%, target 100% (long charge)
   - Power outage during charging

---

## 📱 User Experience Flow

```
1. User selects charging point
   ↓
2. BatteryInputModal appears
   - "Mức pin hiện tại của bạn?" (Slider 0-100%)
   - "Sạc đến?" (80% / 100%)
   - Shows estimate: "20 phút, 15 kWh"
   ↓
3. Charging starts
   - Progress bar shows real-time %
   - Time remaining updates
   ↓
4. Near full (90%)
   - 🟡 Yellow alert: "Sắp đầy pin! Còn 5 phút"
   ↓
5. Battery full (100%)
   - 🟠 Orange alert: "Pin đầy! Vui lòng dừng sạc trong 5 phút"
   - Countdown timer: 5:00, 4:59, 4:58...
   ↓
6a. User stops within 5 min
   - ✅ No idle fee
   - Go to payment
   ↓
6b. User doesn't stop after 5 min
   - 🔴 Red alert: "Đang tính phí đậu xe!"
   - Idle fee counter running
   - Still can stop manually
   ↓
7. Auto-stop after 15 min
   - 🤖 System auto-stops session
   - Final bill includes idle fee
   - Notification sent
   - Payment required
```

---

## 💡 Future Enhancements

1. **Push notifications**
   - "Pin sắp đầy (5 phút nữa)"
   - "Pin đã đầy - vui lòng dừng sạc"
   - "Phiên sạc tự động kết thúc"

2. **Smart target selection**
   - Recommend 80% for daily use
   - 100% only for long trips
   - Battery health tips

3. **Historical analytics**
   - Average charging time
   - Battery degradation tracking
   - Cost per charging session

4. **Dynamic pricing**
   - Lower idle fee for first 5 min
   - Progressive fee increase
   - Peak/off-peak rates

---

## 🔧 Dependencies

**Backend:**
```json
{
  "node-cron": "^3.0.0"  // For background jobs
}
```

**Frontend:**
```json
{
  "@radix-ui/react-slider": "^1.0.0",
  "@radix-ui/react-dialog": "^1.0.0"
}
```

Install:
```bash
npm install node-cron
```

---

**Created**: 2025-01-05
**Status**: Phase 1-3 Complete, Phase 4 Pending
**Next**: Integrate BatteryInputModal into start charging flow
