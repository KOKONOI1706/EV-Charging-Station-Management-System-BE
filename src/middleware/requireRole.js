/**
 * ===============================================================
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * ===============================================================
 * Middleware phân quyền theo vai trò user (Customer, Staff, Admin)
 * 
 * Role Hierarchy:
 * - 0: Customer (khách hàng - quyền thấp nhất)
 * - 1: Staff (nhân viên quản lý trạm sạc)
 * - 2: Admin (quản trị viên - quyền cao nhất)
 * 
 * Middleware functions:
 * 
 * 1. requireRole(allowedRoles: number[])
 *    - Cho phép truy cập nếu user.role nằm trong allowedRoles
 *    - Response 403 Forbidden nếu không đủ quyền
 *    - Example: requireRole([1, 2]) → Chỉ Staff và Admin
 * 
 * 2. requireAdmin
 *    - Shorthand cho requireRole([2])
 *    - Chỉ Admin mới được truy cập
 * 
 * 3. requireStaff
 *    - Shorthand cho requireRole([1, 2])
 *    - Staff hoặc Admin được truy cập
 * 
 * 4. requireCustomer
 *    - Shorthand cho requireRole([0, 1, 2])
 *    - Bất kỳ user authenticated nào cũng được (tất cả roles)
 * 
 * 5. requireOwnership(resourceUserIdField = 'userId')
 *    - Cho phép nếu user sở hữu resource (user.id === resource.userId)
 *    - Admin bypass: Admin luôn có quyền truy cập mọi resource
 *    - Example: User chỉ xem được booking của chính mình
 * 
 * 6. requireOwnershipOrRole(allowedRoles, resourceUserIdField)
 *    - Cho phép nếu user có role trong allowedRoles HOẶC sở hữu resource
 *    - Example: Customer xem booking của mình, Staff xem tất cả bookings
 * 
 * 7. auditAccess
 *    - Log tất cả access attempts để security audit
 *    - Format: [AUDIT] timestamp - User email (Role) - METHOD PATH - IP
 * 
 * Error responses:
 * - 401 Unauthorized: Chưa authenticate (req.user === null)
 * - 403 Forbidden: Đã authenticate nhưng không đủ quyền
 * - 400 Bad Request: Thiếu resourceUserIdField khi check ownership
 * 
 * Usage example:
 * ```javascript
 * router.get('/bookings', requireAuth, requireCustomer, getBookings);
 * router.post('/stations', requireAuth, requireAdmin, createStation);
 * router.get('/bookings/:id', requireAuth, requireOwnership('userId'), getBooking);
 * ```
 * 
 * Dependencies:
 * - requireAuth middleware: Phải chạy trước để có req.user
 */

/**
 * ===== ROLE HIERARCHY =====
 * 0: Customer (lowest privilege)
 * 1: Staff
 * 2: Admin (highest privilege)
 */

/**
 * Require specific role(s) to access endpoint
 * @param {number[]} allowedRoles - Array of allowed role IDs (0: Customer, 1: Staff, 2: Admin)
 * @returns {Function} Express middleware function
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by requireAuth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Check if user's role is in allowed roles
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions to access this resource',
        required: allowedRoles.map(getRoleName),
        current: getRoleName(userRole)
      });
    }

    // User has required role, proceed
    next();
  };
};

/**
 * Require Admin role only (Role 2)
 */
export const requireAdmin = requireRole([2]);

/**
 * Require Staff or Admin role (Role 1 or 2)
 */
export const requireStaff = requireRole([1, 2]);

/**
 * Require any authenticated user (Role 0, 1, or 2)
 */
export const requireCustomer = requireRole([0, 1, 2]);

/**
 * Check if user owns the resource
 * Compares user ID from token with resource owner ID
 * @param {string} resourceUserIdField - Field name in request params/body containing resource owner ID
 */
export const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Admin can access any resource
    if (req.user.role === 2) {
      return next();
    }

    // Get resource owner ID from params or body
    const resourceOwnerId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceOwnerId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Resource owner ID not specified'
      });
    }

    // Check if user owns the resource
    if (req.user.id.toString() !== resourceOwnerId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

/**
 * Allow access if user is owner OR has specified role
 * @param {number[]} allowedRoles - Array of allowed role IDs
 * @param {string} resourceUserIdField - Field name containing resource owner ID
 */
export const requireOwnershipOrRole = (allowedRoles, resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const resourceOwnerId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    // Check if user has required role
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Check if user owns the resource
    if (resourceOwnerId && req.user.id.toString() === resourceOwnerId.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions to access this resource'
    });
  };
};

/**
 * Helper function to get role name from role ID
 */
function getRoleName(roleId) {
  const roleNames = {
    0: 'Customer',
    1: 'Staff',
    2: 'Admin'
  };
  return roleNames[roleId] || 'Unknown';
}

/**
 * Middleware to log access attempts for security auditing
 */
export const auditAccess = (req, res, next) => {
  const user = req.user;
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[AUDIT] ${new Date().toISOString()} - User: ${user?.email || 'Anonymous'} (Role: ${getRoleName(user?.role)}) - ${method} ${path} - IP: ${ip}`);
  
  next();
};
