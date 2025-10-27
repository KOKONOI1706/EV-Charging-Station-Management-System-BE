import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import stationRoutes from './routes/stations.js';
import bookingRoutes from './routes/bookings.js';
import userRoutes from './routes/users.js';
import kvStoreRoutes from './routes/kvStore.js';
import userHistoryRouter from './routes/user-history.js'; 
import personalReportsRouter from './routes/personal-reports.js';
import chargingSessionRoutes from './routes/chargingSession.js';


// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ 
  path: path.join(__dirname, '..', '.env') 
});

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - Flexible for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Additional CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kv', kvStoreRoutes);
app.use('/api/user-history', userHistoryRouter); 
app.use('/api/personal-reports', personalReportsRouter);
app.use('/api/charging', chargingSessionRoutes);

// Debug endpoint to test database
app.get('/api/debug', async (req, res) => {
  try {
    const { supabaseAdmin } = await import('./config/supabase.js');
    
    // Test basic query
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

// Test registration endpoint
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

// Health check endpoint
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

    // Try to test Supabase connection
    try {
      const { supabaseAdmin } = await import('./config/supabase.js');
      
      // Test simple query to check connection with real schema using admin client
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('role_id, name')
        .limit(1);

      if (error) {
        healthStatus.database = 'ERROR';
        healthStatus.database_error = error.message;
        healthStatus.status = 'DEGRADED';
        return res.status(200).json(healthStatus); // Still return 200 but with degraded status
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

export default app;