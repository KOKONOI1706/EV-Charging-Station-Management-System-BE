import express from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        user_id,
        full_name,
        email,
        phone_number,
        status,
        created_at,
        roles (role_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Không thể lấy danh sách user',
        message: error.message
      });
    }

    const formattedUsers = users.map(user => ({
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      phone: user.phone_number,
      role: user.roles.role_name,
      status: user.status,
      createdAt: user.created_at
    }));

    res.json({
      success: true,
      data: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server',
      message: 'Có lỗi xảy ra khi lấy danh sách người dùng'
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        user_id,
        full_name,
        email,
        phone_number,
        status,
        created_at,
        roles (role_name)
      `)
      .eq('user_id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy user',
        message: 'User với ID này không tồn tại'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        phone: user.phone_number,
        role: user.roles.role_name,
        status: user.status,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server',
      message: 'Có lỗi xảy ra khi lấy thông tin user'
    });
  }
});

// POST /api/users/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'customer' } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin bắt buộc',
        message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu quá ngắn',
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email đã tồn tại',
        message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.'
      });
    }

    // Get role_id from roles table
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('role_id')
      .eq('role_name', role)
      .single();

    if (roleError || !roleData) {
      return res.status(400).json({
        success: false,
        error: 'Role không hợp lệ',
        message: 'Role được chọn không tồn tại trong hệ thống'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        full_name: name,
        email: email,
        phone_number: phone || null,
        password_hash: hashedPassword,
        role_id: roleData.role_id,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select(`
        user_id,
        full_name,
        email,
        phone_number,
        status,
        created_at,
        roles (role_name)
      `)
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        error: 'Đăng ký thất bại',
        message: 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.user_id,
          name: newUser.full_name,
          email: newUser.email,
          phone: newUser.phone_number,
          role: newUser.roles.role_name,
          status: newUser.status
        }
      },
      message: `Đăng ký thành công với vai trò ${newUser.roles.role_name}!`
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server',
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    });
  }
});

// POST /api/users/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin đăng nhập',
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Get user with role information
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        user_id,
        full_name,
        email,
        phone_number,
        password_hash,
        status,
        roles (role_name)
      `)
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Email không tồn tại',
        message: 'Không tìm thấy tài khoản với email này'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Tài khoản bị khóa',
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Mật khẩu không đúng',
        message: 'Mật khẩu bạn nhập không chính xác'
      });
    }

    // Login successful
    res.json({
      success: true,
      data: {
        user: {
          id: user.user_id,
          name: user.full_name,
          email: user.email,
          phone: user.phone_number,
          role: user.roles.role_name,
          status: user.status
        }
      },
      message: `Chào mừng ${user.full_name}! Đăng nhập thành công.`
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server',
      message: 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.'
    });
  }
});

export default router;