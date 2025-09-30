import express from 'express';
import { UserModel } from '../models/User.js';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockUsers,
      total: mockUsers.length
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
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple mock authentication
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // In real app, verify password hash
    // For demo, we'll just return the user
    const { password: userPassword, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token: `mock_token_${user.id}` // In real app, generate JWT
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

// POST /api/users/register - Register new user
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    
    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        token: `mock_token_${newUser.id}`
      },
      message: 'Registration successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

export default router;