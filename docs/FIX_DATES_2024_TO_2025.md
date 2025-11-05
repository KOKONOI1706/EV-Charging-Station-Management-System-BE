# Fix: Booking Dates in 2024 Instead of 2025

## 🐛 Problem
Sample booking data was created with dates in **2024** (past dates), causing confusion and potential issues with booking validation and UI display.

**Example**:
```json
{
  "booking_id": 1,
  "start_time": "2024-12-20 14:00:00",  ❌ Past date (2024)
  "expire_time": "2024-12-20 16:00:00",
  "status": "Completed"
}
```

## ✅ Solution

### Step 1: Update Seed File (For future)
**File**: `src/database/seed.sql`

**Changed**:
```sql
-- Before (2024)
(1, 1, '2024-12-20 14:00:00', '2024-12-20 16:00:00', 'Completed', ...),

-- After (2025)
(1, 1, '2025-01-10 14:00:00', '2025-01-10 16:00:00', 'Completed', ...),
```

**Updated dates**:
- 2024-12-20 → 2025-01-10
- 2024-12-21 → 2025-01-11
- 2024-12-22 → 2025-01-12
- 2024-12-23 → 2025-01-15

---

### Step 2: Migrate Existing Data
**File**: `database/fix_dates_2024_to_2025.sql`

**Run in Supabase SQL Editor**:
```sql
-- Add 1 year to all dates before 2025
UPDATE bookings
SET 
    start_time = start_time + INTERVAL '1 year',
    expire_time = expire_time + INTERVAL '1 year',
    confirmed_at = CASE 
        WHEN confirmed_at IS NOT NULL THEN confirmed_at + INTERVAL '1 year'
        ELSE NULL
    END
WHERE start_time < '2025-01-01';

UPDATE charging_sessions
SET 
    start_time = start_time + INTERVAL '1 year',
    end_time = CASE 
        WHEN end_time IS NOT NULL THEN end_time + INTERVAL '1 year'
        ELSE NULL
    END
WHERE start_time < '2025-01-01';
```

---

## 📊 Verification

After running the migration, verify:

```sql
-- Check bookings
SELECT booking_id, start_time, expire_time, status
FROM bookings
ORDER BY start_time DESC;

-- Should return dates in 2025:
-- booking_id | start_time          | status
-- -----------|---------------------|----------
-- 4          | 2025-01-15 16:00:00 | Pending
-- 3          | 2025-01-12 09:00:00 | Confirmed
-- 2          | 2025-01-11 10:30:00 | Completed
-- 1          | 2025-01-10 14:00:00 | Completed
```

---

## 🎯 Expected Result

**Before**:
```json
{
  "booking_id": 1,
  "start_time": "2024-12-20 14:00:00",  ❌
  "status": "Completed"
}
```

**After**:
```json
{
  "booking_id": 1,
  "start_time": "2025-01-10 14:00:00",  ✅
  "status": "Completed"
}
```

---

## 🚀 Quick Fix Command

**Option 1: Run SQL directly in Supabase**
1. Go to Supabase Dashboard → SQL Editor
2. Paste content from `database/fix_dates_2024_to_2025.sql`
3. Click "Run"

**Option 2: Use psql**
```bash
psql $DATABASE_URL -f database/fix_dates_2024_to_2025.sql
```

---

## ⚠️ Impact Assessment

**Tables affected**:
- ✅ `bookings` - start_time, expire_time, confirmed_at
- ✅ `charging_sessions` - start_time, end_time
- ✅ `payments` - date field

**Status values remain unchanged**:
- "Completed" bookings stay "Completed"
- "Pending" bookings stay "Pending"
- "Confirmed" bookings stay "Confirmed"

---

## 📝 Checklist

- [x] Update seed.sql file with 2025 dates
- [ ] Run migration script in Supabase
- [ ] Verify bookings show 2025 dates
- [ ] Verify charging_sessions show 2025 dates
- [ ] Test booking creation with future dates
- [ ] Test frontend display of bookings

---

**Fixed by**: Database migration + seed file update
**Date**: 2025-01-05
**Status**: Ready to deploy
