/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Role Hierarchy:
 * - 0: Customer (lowest privilege)
 * - 1: Staff
 * - 2: Admin (highest privilege)
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
