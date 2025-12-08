/**
 * ===============================================================
 * MIDDLEWARE EXPORT INDEX (BACKEND)
 * ===============================================================
 * Central export point cho tất cả middleware functions
 * 
 * Mô tả:
 * File index tập trung export tất cả middlewares để dễ import trong routes.
 * Thay vì import từng middleware riêng lẻ, có thể import tất cả từ './middleware'.
 * 
 * Exports:
 * 
 * **Authentication Middlewares (authMiddleware.js):**
 * - requireAuth: Bắt buộc phải có token hợp lệ, gắn req.user
 * - optionalAuth: Token optional, không reject nếu thiếu
 * 
 * **Authorization Middlewares (requireRole.js):**
 * - requireRole(allowedRoles[]): Check user role trong allowed list
 * - requireAdmin: Chỉ Admin (role=2)
 * - requireStaff: Staff hoặc Admin (role=1,2)
 * - requireCustomer: Bất kỳ authenticated user nào (role=0,1,2)
 * - requireOwnership(field): Check user sở hữu resource
 * - requireOwnershipOrRole(roles[], field): Owner HOẶC có role
 * - auditAccess: Log tất cả access attempts
 * 
 * Usage Examples:
 * 
 * 1. **Import tất cả:**
 * ```javascript
 * import { requireAuth, requireAdmin, auditAccess } from '../middleware/index.js';
 * 
 * router.get('/admin-only', requireAuth, requireAdmin, getAdminData);
 * ```
 * 
 * 2. **Chain middlewares:**
 * ```javascript
 * router.post('/bookings', requireAuth, requireCustomer, createBooking);
 * router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);
 * ```
 * 
 * 3. **Ownership check:**
 * ```javascript
 * router.get('/bookings/:userId', requireAuth, requireOwnership('userId'), getBookings);
 * ```
 * 
 * Dependencies:
 * - authMiddleware.js: Authentication logic
 * - requireRole.js: Authorization logic
 */

export { requireAuth, optionalAuth } from './authMiddleware.js';
export { 
  requireRole, 
  requireAdmin, 
  requireStaff, 
  requireCustomer,
  requireOwnership,
  requireOwnershipOrRole,
  auditAccess
} from './requireRole.js';
