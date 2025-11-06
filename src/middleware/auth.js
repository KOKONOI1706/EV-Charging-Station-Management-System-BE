import jwt from 'jsonwebtoken';
import supabase from '../supabase/client.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Access token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id || decoded.sub;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', userId)
      .single();

    if (error || !user) return res.status(403).json({ success: false, message: 'Invalid token or user not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.',
      required: allowedRoles,
      current: req.user.role
    });
  }
  next();
};

export const requireAdmin = requireRole(['admin']);
export const requireAdminOrStaff = requireRole(['admin', 'staff']);
export const requireAuth = requireRole(['admin', 'staff', 'user']);
