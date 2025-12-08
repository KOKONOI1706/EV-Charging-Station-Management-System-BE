/**
 * ===============================================================
 * VERIFICATION STORE (LƯU TRỮ MÃ XÁC THỰC)
 * ===============================================================
 * In-memory store quản lý mã xác thực email (verification codes)
 * 
 * Chức năng:
 * - 🔢 Tạo và lưu mã xác thực (6 digits)
 * - ⏰ Auto-expire sau 10 phút
 * - ✅ Verify mã nhập vào
 * - 🧹 Cleanup tự động mã hết hạn
 * 
 * Data structure:
 * Map<email, { code, expiresAt, verified }>
 * 
 * - email: String (key)
 * - code: String (6 digits VD: "123456")
 * - expiresAt: Number (timestamp milliseconds)
 * - verified: Boolean (true sau khi verify thành công)
 * 
 * Methods:
 * 
 * 1. createCode(email, code)
 *    - Lưu code cho email
 *    - expiresAt = now + 10 minutes
 *    - verified = false
 * 
 * 2. verifyCode(email, code): boolean
 *    - Kiểm tra entry tồn tại
 *    - Kiểm tra chưa expire
 *    - So sánh code
 *    - Nếu match → set verified = true
 *    - Return true/false
 * 
 * 3. isVerified(email): boolean
 *    - Return entry?.verified === true
 * 
 * 4. clearVerification(email)
 *    - Xóa entry khỏi Map
 * 
 * 5. cleanupExpired()
 *    - Loop qua tất cả entries
 *    - Xóa entries có expiresAt < now
 *    - Chạy tự động mỗi 60s (setInterval)
 * 
 * Flow đăng ký:
 * 1. User nhập email → Backend gửi email chứa code
 * 2. createCode(email, code) → Lưu vào store
 * 3. User nhập code → Frontend gọi verify
 * 4. Backend verifyCode(email, code) → Return true/false
 * 5. Nếu true → Cho phép đăng ký
 * 6. clearVerification(email) → Xóa code sau khi dùng
 * 
 * Expiration:
 * - Code valid trong 10 phút
 * - Sau 10 phút → verifyCode return false
 * - cleanupExpired tự động xóa mỗi 60s
 * 
 * Note:
 * - In-memory: Mất data khi restart server
 * - Production: Nên dùng Redis hoặc DB
 * - Single instance only (không dùng cho multi-server)
 * 
 * Dependencies:
 * - None (pure JavaScript Map)
 */

// Simple in-memory verification store
// Stores { email -> { code, expiresAt, verified } }
const store = new Map();

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function createCode(email, code) {
  const expiresAt = Date.now() + CODE_TTL_MS;
  store.set(email, { code, expiresAt, verified: false });
}

export function verifyCode(email, code) {
  const entry = store.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(email);
    return false;
  }
  if (entry.code !== code) return false;
  entry.verified = true;
  store.set(email, entry);
  return true;
}

export function isVerified(email) {
  const entry = store.get(email);
  return entry?.verified === true;
}

export function clearVerification(email) {
  store.delete(email);
}

export function cleanupExpired() {
  const now = Date.now();
  for (const [email, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(email);
  }
}

// Periodic cleanup
setInterval(cleanupExpired, 60 * 1000);

export default {
  createCode,
  verifyCode,
  isVerified,
};
