// ============================================
// QUICK REFERENCE: Authorization Middleware
// ============================================

/**
 * Import middleware vào route file:
 */
import { requireAuth, requireAdmin, requireStaff } from '../middleware/index.js';

// ============================================
// USE CASES
// ============================================

/**
 * 1. PUBLIC ENDPOINT (không cần đăng nhập)
 */
router.get('/public-data', async (req, res) => {
  // Anyone can access
});

/**
 * 2. OPTIONAL AUTH (có thể đăng nhập hoặc không)
 */
import { optionalAuth } from '../middleware/index.js';

router.get('/stations', optionalAuth, async (req, res) => {
  if (req.user) {
    console.log('Logged in user:', req.user.email);
  } else {
    console.log('Anonymous user');
  }
});

/**
 * 3. REQUIRE LOGIN (bất kỳ user nào đã đăng nhập)
 */
router.get('/profile', requireAuth, async (req, res) => {
  // req.user is available
  const userId = req.user.id;
  const userRole = req.user.role; // 0, 1, or 2
});

/**
 * 4. ADMIN ONLY (chỉ Admin - Role 2)
 */
router.post('/stations', requireAuth, requireAdmin, async (req, res) => {
  // Only Admin can create stations
  // req.user.role === 2
});

/**
 * 5. STAFF OR ADMIN (Role 1 hoặc 2)
 */
router.get('/users', requireAuth, requireStaff, async (req, res) => {
  // Staff (role 1) or Admin (role 2) can view users
  // req.user.role === 1 or 2
});

/**
 * 6. OWNERSHIP CHECK (user chỉ truy cập dữ liệu của mình)
 */
router.put('/users/:id', requireAuth, async (req, res) => {
  const requestedUserId = req.params.id;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  // Allow if owner OR admin
  if (requestedUserId !== currentUserId.toString() && currentUserRole !== 2) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You can only update your own data'
    });
  }

  // Continue...
});

/**
 * 7. CUSTOM ROLE CHECK
 */
import { requireRole } from '../middleware/index.js';

// Only Customer (0) and Staff (1) - NOT Admin
router.post('/feedback', requireAuth, requireRole([0, 1]), async (req, res) => {
  // Custom role array
});

/**
 * 8. AUDIT LOGGING
 */
import { auditAccess } from '../middleware/index.js';

router.delete('/stations/:id', requireAuth, requireAdmin, auditAccess, async (req, res) => {
  // This will log: User, Role, Action, IP, Timestamp
});

// ============================================
// req.user STRUCTURE
// ============================================

/*
After requireAuth middleware, req.user contains:
{
  id: 123,                    // User ID
  email: "user@example.com",  // User email
  name: "John Doe",           // User name
  phone: "0123456789",        // User phone
  role: 2,                    // Role as number: 0=Customer, 1=Staff, 2=Admin
  roleName: "admin",          // Role as string: customer, staff, admin
  roleId: 3,                  // Database role_id
  isActive: true              // Account status
}
*/

// ============================================
// ERROR RESPONSES
// ============================================

/*
401 Unauthorized (no token or invalid token):
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided"
}

403 Forbidden (valid token but insufficient role):
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions to access this resource",
  "required": ["Admin"],
  "current": "Customer"
}
*/

// ============================================
// ROLE HIERARCHY
// ============================================

/*
Role 0: Customer
  - View stations
  - Create reservations
  - Start/stop own charging sessions
  - View own profile/history
  - Make payments

Role 1: Staff
  - All Customer permissions
  - View all users (read-only)
  - View all sessions
  - Generate reports
  - View analytics

Role 2: Admin
  - All Staff permissions
  - Create/Edit/Delete stations
  - Manage charging points
  - Edit any user
  - Change user roles
  - View revenue reports
  - Full system access
*/

export {};
