# 💰 Price Migration - Quick Reference

## 🎯 TL;DR

**Thay đổi chính:** Giá điện giờ được lưu ở từng **charging point**, không phải ở **station** nữa.

---

## 📋 Checklist Migration

### Database (Priority: HIGH)
- [ ] Chạy `migrate_price_to_charging_points.sql`
- [ ] Verify: Tất cả charging points có `price_per_kwh` > 0
- [ ] Backup database trước khi chạy

### Backend Code (Priority: HIGH)
- [ ] Update `getChargingPoints()` - include `price_per_kwh`
- [ ] Update `calculateCost()` - use point price instead of station price
- [ ] Update `createReservation()` - estimate cost from point price
- [ ] Test: Cost calculation chính xác

### Frontend Code (Priority: MEDIUM)
- [ ] Update `ChargingPoint` interface - add `price_per_kwh: number`
- [ ] Update `ChargingPointCard` - display point price
- [ ] Update `StartChargingModal` - use point price for estimation
- [ ] Update `ReservationModal` - use point price
- [ ] Test: UI shows different prices for different points

---

## 🔍 Quick SQL Queries

### Check current prices
```sql
SELECT 
  s.name as station,
  cp.name as point,
  cp.power_kw,
  cp.price_per_kwh
FROM charging_points cp
JOIN stations s ON cp.station_id = s.id
ORDER BY s.name, cp.point_id;
```

### Find points without price
```sql
SELECT * FROM charging_points 
WHERE price_per_kwh IS NULL OR price_per_kwh = 0;
```

### Update all points to same price (if needed)
```sql
UPDATE charging_points SET price_per_kwh = 5000;
```

### Set different prices by power
```sql
-- Normal: 5000 VND/kWh
UPDATE charging_points SET price_per_kwh = 5000 WHERE power_kw <= 50;

-- Fast: 6000 VND/kWh
UPDATE charging_points SET price_per_kwh = 6000 WHERE power_kw > 50;
```

---

## 🔧 Code Snippets

### Backend - Get Point Price
```javascript
// OLD (WRONG)
const price = station.price_per_kwh;

// NEW (CORRECT)
const { data: point } = await supabase
  .from('charging_points')
  .select('price_per_kwh')
  .eq('point_id', pointId)
  .single();
const price = point.price_per_kwh;
```

### Frontend - Display Price
```tsx
// OLD (WRONG)
<span>{station.price_per_kwh} VND/kWh</span>

// NEW (CORRECT)
<span>{chargingPoint.price_per_kwh.toLocaleString('vi-VN')} VND/kWh</span>
```

---

## ⚠️ Common Mistakes

### ❌ DON'T
```javascript
// Don't use station price anymore
const cost = energy * station.price_per_kwh;
```

### ✅ DO
```javascript
// Use charging point price
const cost = energy * chargingPoint.price_per_kwh;
```

---

## 🧪 Test Cases

1. **Create reservation** → Should show estimated cost based on point price
2. **Start charging** → Should calculate cost using point price
3. **Different points** → Should show different prices if configured
4. **Fast charger** → Should be more expensive than normal charger
5. **Invoice** → Should reflect actual point price used

---

## 📞 Troubleshooting

### Issue: Charging points have price = 0
**Solution:** Run migration SQL again or manually update:
```sql
UPDATE charging_points cp
SET price_per_kwh = s.price_per_kwh
FROM stations s
WHERE cp.station_id = s.id AND cp.price_per_kwh = 0;
```

### Issue: Frontend shows wrong price
**Solution:** Clear localStorage và reload:
```javascript
localStorage.clear();
location.reload();
```

### Issue: Cost calculation incorrect
**Solution:** Verify you're using `point.price_per_kwh`, not `station.price_per_kwh`

---

## 📚 Full Documentation

Xem `PRICING_MIGRATION_GUIDE.md` để biết chi tiết đầy đủ.

---

**Quick Start:** 
1. Run SQL migration
2. Update backend controllers
3. Update frontend components
4. Test thoroughly
5. Deploy!

✅ **Estimated time:** 2-4 hours
