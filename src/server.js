import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import packageRoutes from './routes/packageRoutes.js';

// Import routes
import stationRoutes from './routes/stations.js';
import bookingRoutes from './routes/bookings.js';
import userRoutes from './routes/users.js';
import kvStoreRoutes from './routes/kvStore.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ 
  path: path.join(__dirname, '..', '.env') 
});

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS configuration - Allow all for development
app.use(cors());

// ✅ Additional CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ✅ Body parsing middleware (fix lỗi Unexpected end of JSON input)
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kv', kvStoreRoutes);
app.use('/api/packages', packageRoutes); // ✅ Đặt trước 404 handler

// ✅ Debug endpoint to test database
app.get('/api/debug', async (req, res) => {
  try {
    const { supabaseAdmin } = await import('./config/supabase.js');
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('*');
    
    res.json({
      success: true,
      roles: roles,
      error: error
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});

// ✅ Test registration endpoint
app.get('/api/test-register', (req, res) => {
  const mockUser = {
    id: `user_${Date.now()}`,
    name: "Test User",
    email: "test@example.com",
    role: "customer",
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: {
      user: mockUser,
      token: `demo_token_${mockUser.id}`
    },
    message: 'Test registration successful'
  });
});

// ✅ Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      message: 'EV Charging Backend is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'CHECKING...',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    try {
      const { supabaseAdmin } = await import('./config/supabase.js');
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('role_id, name')
        .limit(1);

      if (error) {
        healthStatus.database = 'ERROR';
        healthStatus.database_error = error.message;
        healthStatus.status = 'DEGRADED';
      } else {
        healthStatus.database = 'CONNECTED';
      }
    } catch (dbError) {
      healthStatus.database = 'ERROR';
      healthStatus.database_error = dbError.message;
      healthStatus.status = 'DEGRADED';
    }

    res.json(healthStatus);
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// ✅ 404 handler (phải đặt sau tất cả route thật)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// ✅ Server start
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
