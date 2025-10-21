import express from 'express';
import supabase from '../supabase/client.js';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    // Transform data to match frontend expectations
    const transformedUsers = (users || []).map(user => ({
      id: user.id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role || 'customer',
      createdAt: user.created_at,
      isActive: true
    }));

    res.json({
      success: true,
      data: transformedUsers,
      total: transformedUsers.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// POST /api/users/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, full_name'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone: phone || null
        }
      }
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        error: authError.message
      });
    }

    // Create user profile in database
    let profile = null;
    if (authData.user) {
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          email: authData.user.email,
          full_name,
          phone: phone || null,
          role: 'customer',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue anyway as auth user was created
      } else {
        profile = newProfile;
      }
    }

    res.status(201).json({
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        profile: profile
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        error: authError.message
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    res.json({
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        profile: profile || null
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
      message: error.message
    });
  }
});

// POST /api/users/logout - Logout user
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout',
      message: error.message
    });
  }
});

// GET /api/users/profile/:id - Get user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// PUT /api/users/profile/:id - Update user profile
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, preferences } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (preferences !== undefined) updateData.preferences = preferences;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// POST /api/users/forgot-password - Send password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send password reset email',
      message: error.message
    });
  }
});

// POST /api/users/reset-password - Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { password, access_token, refresh_token } = req.body;

    if (!password || !access_token || !refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Password, access_token, and refresh_token are required'
      });
    }

    // Set session first
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (sessionError) {
      return res.status(400).json({
        success: false,
        error: sessionError.message
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password
    });

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: updateError.message
      });
    }

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      message: error.message
    });
  }
});

// GET /api/users/verify-session - Verify user session
router.get('/verify-session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No valid authorization token provided'
      });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      success: true,
      data: {
        user,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify session',
      message: error.message
    });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;

    const { data: user, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by updating profile
    const { data: user, error } = await supabase
      .from('user_profiles')
      .update({ 
        role: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

export default router;