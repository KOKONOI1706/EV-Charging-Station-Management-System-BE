import jwt from 'jsonwebtoken';
import supabase from '../supabase/client.js';

// Helper to map numeric role_id to string role (adjust mapping if your DB differs)
function mapRoleIdToName(role_id) {
  if (role_id === null || role_id === undefined) return undefined;
  const id = Number(role_id);
  switch (id) {
    case 1:
      return 'admin';
    case 2:
      return 'staff';
    case 3:
      return 'user';
    default:
      return undefined;
  }
}

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Access token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Accept common token id keys
    const userIdFromToken = decoded.userId || decoded.user_id || decoded.id || decoded.sub;

    // Fetch user record from DB by id (try different id column names)
    let user;
    if (userIdFromToken) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${userIdFromToken},user_id.eq.${userIdFromToken}`)
        .maybeSingle();

      if (!error && data) user = data;
    }

    // If not found by token, try to fallback to email in token
    if (!user && decoded.email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', decoded.email)
        .maybeSingle();
      if (!error && data) user = data;
    }

    if (!user) return res.status(403).json({ success: false, message: 'Invalid token or user not found' });

    // Normalize user object: ensure id and role fields exist and normalize role to lowercase string
    const rawRole = user.role || mapRoleIdToName(user.role_id) || user.role_id || null;
    const normalizedRole = rawRole ? String(rawRole).toLowerCase() : null;

    req.user = {
      // prefer id or user_id depending on schema
      id: user.id || user.user_id || user.userId || null,
      user_id: user.user_id || user.id || null,
      email: user.email,
      full_name: user.full_name || user.name || null,
      // normalized role
      role: normalizedRole,
      raw: user
    };

    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  const currentRole = (req.user.role || '').toString().toLowerCase();
  // allow numeric role ids in allowedRoles too (e.g., ['admin',2]) and normalize allowed list
  const allowed = allowedRoles
    .map(r => (typeof r === 'number' ? mapRoleIdToName(r) : r))
    .map(a => (a ? String(a).toLowerCase() : a));

  if (!currentRole || !allowed.includes(currentRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.',
      required: allowedRoles,
      current: currentRole
    });
  }

  next();
};

export const requireAdmin = requireRole(['admin']);
export const requireAdminOrStaff = requireRole(['admin', 'staff']);
export const requireAuth = requireRole(['admin', 'staff', 'user']);
export const requireUser = requireRole(['user']);
