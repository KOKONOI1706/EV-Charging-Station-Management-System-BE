/**
 * Middleware Export Index
 * Central export point for all middleware functions
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
