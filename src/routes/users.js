import express from 'express';
import { UserModel } from '../models/User.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { createCode, verifyCode, isVerified, clearVerification } from '../services/verificationStore.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        user_id,
        name,
        email,
        phone,
        created_at,
        is_active,
        roles!inner(name)
      `)
      .eq('is_active', true);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    // Transform data to match frontend expectations
    const transformedUsers = users.map(user => ({
      id: user.user_id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.roles.name,
      createdAt: user.created_at,
      isActive: user.is_active
    }));

    res.json({
      success: true,
      data: transformedUsers,
      total: transformedUsers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', (req, res) => {
  try {
    const user = mockUsers.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// POST /api/users/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        user_id,
        name,
        email,
        phone,
        created_at,
        is_active,
        roles!inner(name)
      `)
      .eq('email', email)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = users[0];
    
    // For demo purposes, accept any password for existing users
    // In production, verify password hash here
    
    const userResponse = {
      id: user.user_id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.roles.name,
      createdAt: user.created_at,
      isActive: user.is_active
    };
    
    res.json({
      success: true,
      data: {
        user: userResponse,
        token: `demo_token_${user.user_id}` // In real app, generate JWT
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

// POST /api/users/send-code - send verification code to given email
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    createCode(email, code);

    // Send email (may log to console if SMTP not configured)
    await sendVerificationEmail(email, code);

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ success: false, error: 'Failed to send code' });
  }
});

// POST /api/users/verify-code - verify code for email
router.post('/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, error: 'Email and code required' });

    const ok = verifyCode(email, code);
    if (!ok) return res.status(400).json({ success: false, error: 'Invalid or expired code' });

    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// POST /api/users/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    try {
      // Require email verification before registering
      if (!isVerified(email)) {
        return res.status(400).json({ success: false, error: 'Email not verified. Please verify before registering.' });
      }
      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabaseAdmin
        .from('users')
        .select('user_id, email')
        .or(`email.eq.${email}${phone ? `,phone.eq.${phone}` : ''}`)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'User with this email or phone already exists'
        });
      }

      // Get customer role ID
      const { data: roles, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('role_id')
        .eq('name', 'customer')
        .limit(1);

      if (roleError) {
        throw new Error('Role fetch failed');
      }

      const customerRoleId = roles?.[0]?.role_id || 1;

      // Create new user in database
      // TODO: Hash password with bcrypt before storing in production
      const { data: newUsers, error: insertError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            name,
            email,
            phone: phone || null,
            role_id: customerRoleId,
            is_active: true
          }
        ])
        .select(`
          user_id,
          name,
          email,
          phone,
          created_at,
          is_active,
          roles!inner(name)
        `);

      if (insertError) {
        throw new Error('User creation failed');
      }

      const newUser = newUsers?.[0];
      if (!newUser) {
        throw new Error('No user data returned');
      }
      
      // Transform response
      const userResponse = {
        id: newUser.user_id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.roles.name,
        createdAt: newUser.created_at,
        isActive: newUser.is_active
      };

      // Clear verification record for this email
      clearVerification(email);
      
      // Send welcome email (async, don't wait)
      sendWelcomeEmail(email, name).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
      
      res.status(201).json({
        success: true,
        data: {
          user: userResponse,
          token: `demo_token_${newUser.user_id}` // TODO: Replace with real JWT
        },
        message: 'Registration successful'
      });

    } catch (dbError) {
      console.error('Database error during registration:', dbError.message);
      
      // Fallback to mock data if database fails
      const mockUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        phone: phone || null,
        role: 'customer',
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      res.status(201).json({
        success: true,
        data: {
          user: mockUser,
          token: `demo_token_${mockUser.id}`
        },
        message: 'Registration successful (database unavailable - using temporary account)'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// POST /api/users/forgot-password - Send password reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    // Check if user exists
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('user_id, email, name')
      .eq('email', email)
      .eq('is_active', true)
      .limit(1);

    if (userError || !users || users.length === 0) {
      // Don't reveal if user exists or not (security)
      return res.json({ 
        success: true, 
        message: 'If this email exists, a reset code has been sent' 
      });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    createCode(email, resetCode);

    // Send reset email
    await sendPasswordResetEmail(email, resetCode);

    res.json({ 
      success: true, 
      message: 'Password reset code sent to your email' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process password reset request' 
    });
  }
});

// POST /api/users/reset-password - Reset password with code
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, code, and new password are required' 
      });
    }

    // Verify the reset code
    const isValidCode = verifyCode(email, code);
    if (!isValidCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired reset code' 
      });
    }

    // TODO: In production, hash the password with bcrypt
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    // Note: This is a simplified version. In production, you'd store password hash
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        // password: hashedPassword, // TODO: Add password column and hash
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .eq('is_active', true);

    if (updateError) {
      throw new Error('Failed to update password');
    }

    // Clear the reset code
    clearVerification(email);

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset password' 
    });
  }
});

// PUT /api/users/:id - Update user profile
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, phone, vehicleInfo } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Build update object
    const updates = {
      updated_at: new Date().toISOString()
    };

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select(`
        user_id,
        name,
        email,
        phone,
        created_at,
        roles!inner(name)
      `)
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update user profile',
        message: updateError.message
      });
    }

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Transform response to match frontend User interface
    const responseUser = {
      id: updatedUser.user_id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      role: updatedUser.roles.name,
      memberSince: new Date(updatedUser.created_at).toISOString().split('T')[0],
      totalSessions: 0,
      totalSpent: 0,
      favoriteStations: [],
      vehicleInfo: vehicleInfo || {
        make: "N/A",
        model: "N/A",
        year: 2020,
        batteryCapacity: 50
      }
    };

    res.json({
      success: true,
      data: {
        user: responseUser
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

export default router;