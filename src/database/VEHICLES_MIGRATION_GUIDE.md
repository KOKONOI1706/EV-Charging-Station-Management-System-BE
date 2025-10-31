# Hướng dẫn: Thêm các trường mới vào bảng Vehicles

## 🎯 Vấn đề
Bảng `vehicles` trong database hiện tại thiếu các trường:
- `make` (Hãng xe)
- `model` (Mẫu xe)  
- `year` (Năm sản xuất)
- `color` (Màu sắc)
- `updated_at` (Thời gian cập nhật)

## ✅ Giải pháp

### Bước 1: Truy cập Supabase Dashboard

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Click vào **SQL Editor** trong sidebar trái

### Bước 2: Chạy Migration SQL

1. Click **New Query** để tạo query mới
2. Copy toàn bộ nội dung từ file: `src/database/MIGRATION_add_vehicle_fields.sql`
3. Paste vào SQL Editor
4. Click **Run** (hoặc nhấn `Ctrl+Enter`)

### Bước 3: Xác nhận thành công

Sau khi chạy SQL, bạn sẽ thấy:
- ✅ Các column mới đã được thêm
- ✅ Trigger tự động cập nhật `updated_at` đã được tạo
- ✅ Kết quả query hiển thị cấu trúc bảng mới

### Bước 4: Test lại ứng dụng

1. Khởi động lại backend server (nếu cần):
   ```bash
   cd EV-Charging-Station-Management-System-BE
   npm start
   ```

2. Refresh trang web frontend
3. Thử thêm xe mới trong tab "Vehicles" → Nên hoạt động bình thường! 🎉

## 📋 Cấu trúc mới của bảng vehicles

```sql
vehicles (
  vehicle_id          serial PRIMARY KEY,
  user_id             int,
  plate_number        varchar(50) NOT NULL,
  make                varchar(100),           -- ✨ MỚI
  model               varchar(100),           -- ✨ MỚI
  year                int,                    -- ✨ MỚI
  color               varchar(50),            -- ✨ MỚI
  battery_capacity_kwh numeric(10,3),
  connector_type_id   int,
  created_at          timestamp DEFAULT now(),
  updated_at          timestamp DEFAULT now() -- ✨ MỚI (tự động cập nhật)
)
```

## 🔍 Troubleshooting

### Lỗi: "column already exists"
→ Không vấn đề gì! SQL đã có `IF NOT EXISTS`, chỉ cần chạy lại

### Lỗi: "permission denied"
→ Đảm bảo bạn đang dùng tài khoản có quyền admin trong Supabase

### Lỗi: "table vehicles does not exist"
→ Chạy migration đầy đủ từ file `migration_simple.sql` trước

## 📞 Cần trợ giúp?

Nếu gặp vấn đề, hãy:
1. Check console logs trong browser (F12)
2. Check backend logs trong terminal
3. Kiểm tra Supabase Database Logs

---

**Lưu ý**: Migration này an toàn và không ảnh hưởng đến dữ liệu hiện có trong bảng.
