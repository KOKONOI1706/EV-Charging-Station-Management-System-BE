# Supabase Dashboard Quick Reference

## 🚀 Essential URLs
- **Dashboard**: https://supabase.com/dashboard/project/xxdqbldczmlvvnbxsemq
- **Table Editor**: https://supabase.com/dashboard/project/xxdqbldczmlvvnbxsemq/editor
- **SQL Editor**: https://supabase.com/dashboard/project/xxdqbldczmlvvnbxsemq/sql
- **API Docs**: https://supabase.com/dashboard/project/xxdqbldczmlvvnbxsemq/api

## 📝 Common SQL Queries

### View all data
```sql
-- All stations with their charging points
SELECT s.*, COUNT(cp.point_id) as total_points
FROM stations s
LEFT JOIN charging_points cp ON s.station_id = cp.station_id
GROUP BY s.station_id;

-- Recent bookings
SELECT b.booking_id, u.name, s.name as station, b.start_time, b.status
FROM bookings b
JOIN users u ON b.user_id = u.user_id  
JOIN stations s ON b.station_id = s.station_id
ORDER BY b.created_at DESC;
```

### Analytics queries
```sql
-- Popular stations
SELECT s.name, COUNT(b.booking_id) as total_bookings
FROM stations s
LEFT JOIN bookings b ON s.station_id = b.station_id
GROUP BY s.station_id, s.name
ORDER BY total_bookings DESC;

-- Revenue by payment method
SELECT pm.name, SUM(p.amount) as total_revenue
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.payment_method_id
GROUP BY pm.payment_method_id, pm.name;
```

### Maintenance queries
```sql
-- Check charging point status
SELECT status, COUNT(*) 
FROM charging_points 
GROUP BY status;

-- Find inactive users
SELECT * FROM users 
WHERE created_at < NOW() - INTERVAL '30 days'
AND user_id NOT IN (SELECT DISTINCT user_id FROM bookings);
```

## 🎯 Quick Actions
1. **Add new station**: Table Editor → stations → Insert
2. **Update point status**: Table Editor → charging_points → Edit status
3. **Check recent activity**: SQL Editor → Run booking queries
4. **Monitor errors**: Logs → Filter by error level
5. **Test API**: API → Try endpoints

## 🔒 Security Notes
- Always use **Row Level Security** policies
- Don't expose sensitive data in API
- Use **service_role** key only in backend
- Regular backup via SQL Editor exports