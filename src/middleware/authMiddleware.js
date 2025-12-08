/**
 * ===============================================================
 * AUTHENTICATION MIDDLEWARE (BACKEND)
 * ===============================================================
 * Middleware xác thực JWT token và gắn thông tin user vào request
 * 
 * Chức năng:
 * - 🔐 Xác thực token từ header Authorization: Bearer <token>
 * - 👤 Load thông tin user từ database theo token
 * - 🎭 Map role từ DB (Driver, Station Manager, Admin) → Frontend (customer, staff, admin)
 * - ✅ Kiểm tra user is_active = true
 * - 🔓 Optional auth: Cho phép request không có token (public endpoints)
 * 
 * Token format:
 * - Demo token: "demo_token_<userId>" (temporary, for testing)
 * - Real JWT: "Bearer <jwt_token>" (TODO: chưa implement JWT verify)
 * 
 * Response nếu fail:
 * - 401 Unauthorized: Token không hợp lệ hoặc user không tồn tại
 * - Error messages: "No token provided", "Invalid token format", "Invalid or expired token"
 * 
 * req.user sau khi authenticated:
 * ```javascript
 * {
 *   id: user_id,
 *   email: string,
 *   name: string,
 *   phone: string,
 *   role: 0 | 1 | 2,  // 0=customer, 1=staff, 2=admin
 *   roleName: 'customer' | 'staff' | 'admin',
 *   roleId: database role_id,
 *   isActive: boolean
 * }
 * ```
 * 
 * Exports:
 * - requireAuth: Bắt buộc phải có token hợp lệ
 * - optionalAuth: Token optional, vẫn next() nếu không có
 * 
 * Dependencies:
 * - Supabase Admin: Query users table với role join
 * - JWT library: (TODO) Cần implement cho production
 */

import { supabaseAdmin } from '../config/supabase.js';

/**
 * ===== MIDDLEWARE: requireAuth =====
 * Bắt buộc phải có token hợp lệ, reject nếu không có hoặc invalid
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }
 
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token format'
      });
    }

    // For demo tokens (temporary - replace with real JWT verification)
    if (token.startsWith('demo_token_')) {
      const userId = token.replace('demo_token_', '');
      
      // Fetch user from database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select(`
          user_id,
          name,
          email,
          phone,
          role_id,
          is_active,
          roles!inner(role_id, name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
      }

      // Map database role names to frontend role names and role numbers
      const roleMapping = {
        'Driver': { name: 'customer', id: 0 },
        'Station Manager': { name: 'staff', id: 1 },
        'Admin': { name: 'admin', id: 2 }
      };

      const mappedRole = roleMapping[user.roles.name] || { name: 'customer', id: 0 };

      // Attach user to request
      req.user = {
        id: user.user_id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: mappedRole.id, // Role as number (0, 1, 2)
        roleName: mappedRole.name, // Role as string (customer, staff, admin)
        roleId: user.role_id, // Database role_id
        isActive: user.is_active
      };

      next();
    } else {
      // TODO: Implement real JWT verification here
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // req.user = decoded;
      // next();
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'JWT verification not implemented yet'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }

    // For demo tokens
    if (token.startsWith('demo_token_')) {
      const userId = token.replace('demo_token_', '');
      
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select(`
          user_id,
          name,
          email,
          phone,
          role_id,
          is_active,
          roles!inner(role_id, name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!error && user) {
        const roleMapping = {
          'Driver': { name: 'customer', id: 0 },
          'Station Manager': { name: 'staff', id: 1 },
          'Admin': { name: 'admin', id: 2 }
        };

        const mappedRole = roleMapping[user.roles.name] || { name: 'customer', id: 0 };

        req.user = {
          id: user.user_id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: mappedRole.id,
          roleName: mappedRole.name,
          roleId: user.role_id,
          isActive: user.is_active
        };
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};
