# 💰 Chuyển đổi Pricing: Station-Level → Charging Point-Level

## 📋 Tổng quan

Thay đổi logic tính giá từ **station-level** (tất cả điểm sạc cùng giá) sang **charging-point-level** (mỗi điểm sạc có giá riêng).

### Lý do thay đổi:
- ✅ Linh hoạt hơn: Fast charger có thể đắt hơn normal charger
- ✅ Chính xác hơn: Giá phụ thuộc vào công suất thực tế
- ✅ Mở rộng: Dễ dàng thêm logic pricing phức tạp (peak hours, etc.)

---

## 🗄️ Database Migration

### Step 1: Run SQL Migration

```bash
# Connect to PostgreSQL
psql -U your_username -d your_database_name

# Run migration file
\i src/database/migrate_price_to_charging_points.sql
```

### Step 2: Verify Migration

```sql
-- Check all charging points have prices
SELECT 
  cp.point_id,
  cp.name,
  cp.power_kw,
  cp.price_per_kwh,
  s.name as station_name
FROM charging_points cp
JOIN stations s ON cp.station_id = s.id
ORDER BY s.name, cp.point_id;

-- Check for any missing prices
SELECT COUNT(*) as points_without_price
FROM charging_points
WHERE price_per_kwh IS NULL OR price_per_kwh = 0;
```

### Schema Changes Summary:

**Before:**
```sql
charging_points.price_rate     -- numeric DEFAULT 0
stations.price_per_kwh         -- numeric NOT NULL (primary source)
```

**After:**
```sql
charging_points.price_per_kwh  -- numeric NOT NULL (primary source)
stations.price_per_kwh         -- numeric (deprecated, used as default only)
```

---

## 🔧 Backend Code Changes

### 1. Update Models

**File: `src/models/ChargingPoint.js`**

```javascript
// Add price_per_kwh to model
class ChargingPoint {
  constructor(data) {
    this.point_id = data.point_id;
    this.name = data.name;
    this.power_kw = data.power_kw;
    this.price_per_kwh = data.price_per_kwh; // ✅ NEW: Primary price field
    this.idle_fee_per_min = data.idle_fee_per_min;
    // ... other fields
  }
}
```

### 2. Update API Controllers

**File: `src/controllers/chargingPointController.js`**

```javascript
// GET /api/stations/:stationId/charging-points
exports.getChargingPoints = async (req, res) => {
  try {
    const { stationId } = req.params;
    
    const { data, error } = await supabase
      .from('charging_points')
      .select(`
        point_id,
        name,
        status,
        power_kw,
        price_per_kwh,        -- ✅ Include price
        idle_fee_per_min,
        connector_type_id,
        pos_x,
        pos_y
      `)
      .eq('station_id', stationId);
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/charging-points (Admin only)
exports.createChargingPoint = async (req, res) => {
  try {
    const { 
      station_id, 
      name, 
      power_kw, 
      price_per_kwh,  // ✅ Required field
      connector_type_id 
    } = req.body;
    
    // Validation
    if (!price_per_kwh || price_per_kwh < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'price_per_kwh is required and must be >= 0' 
      });
    }
    
    const { data, error } = await supabase
      .from('charging_points')
      .insert([{
        station_id,
        name,
        power_kw,
        price_per_kwh,
        connector_type_id,
        status: 'Available'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/charging-points/:pointId/price (Admin only)
exports.updatePrice = async (req, res) => {
  try {
    const { pointId } = req.params;
    const { price_per_kwh } = req.body;
    
    if (price_per_kwh < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Price cannot be negative' 
      });
    }
    
    const { data, error } = await supabase
      .from('charging_points')
      .update({ 
        price_per_kwh,
        updated_at: new Date().toISOString()
      })
      .eq('point_id', pointId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### 3. Update Charging Session Cost Calculation

**File: `src/controllers/chargingSessionController.js`**

```javascript
// Calculate cost based on charging point price, not station price
exports.calculateCost = async (sessionId) => {
  try {
    // Get session with charging point price
    const { data: session, error } = await supabase
      .from('charging_sessions')
      .select(`
        session_id,
        energy_consumed_kwh,
        idle_minutes,
        point_id,
        charging_points!inner (
          price_per_kwh,        -- ✅ Use point price
          idle_fee_per_min
        )
      `)
      .eq('session_id', sessionId)
      .single();
    
    if (error) throw error;
    
    const point = session.charging_points;
    
    // Calculate energy cost
    const energyCost = session.energy_consumed_kwh * point.price_per_kwh;
    
    // Calculate idle fee
    const idleFee = session.idle_minutes * point.idle_fee_per_min;
    
    // Total cost
    const totalCost = energyCost + idleFee;
    
    // Update session
    await supabase
      .from('charging_sessions')
      .update({
        cost: totalCost,
        idle_fee: idleFee
      })
      .eq('session_id', sessionId);
    
    return { energyCost, idleFee, totalCost };
  } catch (error) {
    console.error('Error calculating cost:', error);
    throw error;
  }
};
```

### 4. Update Reservation Price Estimate

**File: `src/controllers/reservationController.js` (bookingController.js)**

```javascript
// POST /api/reservations
exports.createReservation = async (req, res) => {
  try {
    const { userId, pointId, durationMinutes } = req.body;
    
    // Get charging point with price
    const { data: point, error: pointError } = await supabase
      .from('charging_points')
      .select('price_per_kwh, power_kw, station_id')
      .eq('point_id', pointId)
      .single();
    
    if (pointError) throw pointError;
    
    // Estimate energy consumption (rough estimate)
    const estimatedKwh = (point.power_kw * durationMinutes) / 60;
    const priceEstimate = estimatedKwh * point.price_per_kwh;  // ✅ Use point price
    
    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        user_id: userId,
        point_id: pointId,
        station_id: point.station_id,
        start_time: new Date(),
        expire_time: new Date(Date.now() + durationMinutes * 60000),
        price_estimate: Math.round(priceEstimate),
        status: 'Pending'
      }])
      .select()
      .single();
    
    if (bookingError) throw bookingError;
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

## 🎨 Frontend Code Changes

### 1. Update Station API

**File: `src/api/stationApi.ts`**

```typescript
// Remove or deprecate station-level price
export interface Station {
  id: string;
  name: string;
  // ... other fields
  price_per_kwh?: number;  // ⚠️ DEPRECATED: Use charging point price instead
}
```

### 2. Update Charging Points API

**File: `src/api/chargingPointsApi.ts`**

```typescript
export interface ChargingPoint {
  point_id: number;
  name: string;
  status: 'Available' | 'Occupied' | 'Offline' | 'Reserved';
  power_kw: number;
  price_per_kwh: number;        // ✅ Primary price field
  idle_fee_per_min: number;
  connector_type_id: number;
  pos_x?: number;
  pos_y?: number;
}

export async function getStationChargingPoints(stationId: string): Promise<ChargingPoint[]> {
  try {
    const { data, error } = await supabase
      .from('charging_points')
      .select(`
        point_id,
        name,
        status,
        power_kw,
        price_per_kwh,        -- ✅ Include price
        idle_fee_per_min,
        connector_type_id,
        pos_x,
        pos_y
      `)
      .eq('station_id', stationId)
      .order('point_id');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching charging points:', error);
    throw error;
  }
}
```

### 3. Update UI Components

**File: `src/components/ChargingPointCard.tsx`**

```tsx
interface ChargingPointCardProps {
  point: ChargingPoint;
  onSelect: (pointId: number) => void;
}

export function ChargingPointCard({ point, onSelect }: ChargingPointCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{point.name}</CardTitle>
        <Badge>{point.status}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Show point-specific price */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>{point.power_kw} kW</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="font-bold">
              {point.price_per_kwh.toLocaleString('vi-VN')} VND/kWh
            </span>
          </div>
          
          {point.idle_fee_per_min > 0 && (
            <div className="text-sm text-gray-600">
              + {point.idle_fee_per_min.toLocaleString('vi-VN')} VND/phút (idle fee)
            </div>
          )}
        </div>
        
        <Button onClick={() => onSelect(point.point_id)}>
          Chọn điểm sạc
        </Button>
      </CardContent>
    </Card>
  );
}
```

**File: `src/components/StartChargingModal.tsx`**

```tsx
// Update to show point-specific price
export function StartChargingModal({ pointId, onClose }: Props) {
  const [chargingPoint, setChargingPoint] = useState<ChargingPoint | null>(null);
  
  useEffect(() => {
    // Fetch charging point details
    fetchChargingPointDetails(pointId).then(point => {
      setChargingPoint(point);
    });
  }, [pointId]);
  
  // Calculate estimated cost using point price
  const estimatedCost = React.useMemo(() => {
    if (!chargingPoint || !targetBattery || !initialBattery) return 0;
    
    const batteryRange = targetBattery - initialBattery;
    const energyNeeded = (vehicle.battery_capacity_kwh * batteryRange) / 100;
    
    // Use charging point price, not station price
    return energyNeeded * chargingPoint.price_per_kwh;
  }, [chargingPoint, targetBattery, initialBattery, vehicle]);
  
  return (
    <Modal>
      {/* ... */}
      <div className="pricing-info">
        <p>Giá điện: {chargingPoint?.price_per_kwh.toLocaleString('vi-VN')} VND/kWh</p>
        <p className="font-bold">
          Ước tính: {Math.round(estimatedCost).toLocaleString('vi-VN')} VND
        </p>
      </div>
    </Modal>
  );
}
```

---

## 🧪 Testing Checklist

### Backend Tests:

- [ ] Charging points have `price_per_kwh` populated
- [ ] Create charging point with custom price
- [ ] Update charging point price
- [ ] Cost calculation uses point price, not station price
- [ ] Reservation price estimate uses point price
- [ ] Invoices show correct amounts

### Frontend Tests:

- [ ] Charging point cards show individual prices
- [ ] StartChargingModal shows correct price
- [ ] Cost estimation uses point price
- [ ] Different charging points show different prices
- [ ] Fast chargers show higher prices
- [ ] Reservation modal shows correct estimated cost

### Edge Cases:

- [ ] What happens if `price_per_kwh` is NULL? (Should not happen after migration)
- [ ] Can admin update prices for multiple points at once?
- [ ] Do existing sessions use old price or new price?
- [ ] Handle price changes during active sessions

---

## 📊 Pricing Strategy Examples

### Example 1: Power-Based Pricing
```sql
-- Normal chargers: 5000 VND/kWh
UPDATE charging_points SET price_per_kwh = 5000 WHERE power_kw <= 50;

-- Fast chargers: 6000 VND/kWh (+20%)
UPDATE charging_points SET price_per_kwh = 6000 WHERE power_kw > 50 AND power_kw <= 150;

-- Ultra-fast chargers: 7500 VND/kWh (+50%)
UPDATE charging_points SET price_per_kwh = 7500 WHERE power_kw > 150;
```

### Example 2: Location-Based Pricing
```sql
-- Premium locations (airports, malls): +30%
UPDATE charging_points cp
SET price_per_kwh = price_per_kwh * 1.3
FROM stations s
WHERE cp.station_id = s.id
  AND s.name ILIKE '%airport%' OR s.name ILIKE '%mall%';
```

### Example 3: Connector-Based Pricing
```sql
-- CCS/CHAdeMO (fast charging): +25%
UPDATE charging_points cp
SET price_per_kwh = price_per_kwh * 1.25
FROM connector_types ct
WHERE cp.connector_type_id = ct.connector_type_id
  AND ct.code IN ('CCS', 'CHAdeMO');
```

---

## 🚀 Deployment Steps

1. **Backup database** trước khi migrate
2. **Run migration** trên staging environment trước
3. **Test thoroughly** trên staging
4. **Deploy backend** code changes
5. **Run migration** trên production
6. **Deploy frontend** code changes
7. **Monitor** logs và user feedback

---

## 📝 Notes

- `stations.price_per_kwh` được giữ lại làm **default value** khi tạo charging point mới
- Có thể xóa `stations.price_per_kwh` hoàn toàn nếu muốn, nhưng cần update trigger trước
- Pricing strategy có thể phức tạp hơn (peak hours, membership discounts, etc.)

---

## ✅ Summary

| Item | Before | After |
|------|--------|-------|
| Price source | `stations.price_per_kwh` | `charging_points.price_per_kwh` |
| Flexibility | All points same price | Each point can have different price |
| Use case | Simple pricing | Dynamic pricing (power, location, connector type) |
| Admin control | Station-level only | Point-level granular control |

---

**Date:** 2025-11-23  
**Version:** 1.0  
**Status:** Ready for Implementation
