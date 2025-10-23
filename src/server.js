import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './supabase/client.js';
import path from 'path';
import { fileURLToPath } from 'url';
import packageRoutes from './routes/packageRoutes.js';

// Import routes
import usersRouter from './routes/users.js';
import stationsRouter from './routes/stations.js';
import reservationsRouter from './routes/reservations.js';
import paymentsRouter from './routes/payments.js';
import analyticsRouter from './routes/analytics.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ 
  path: path.join(__dirname, '..', '.env') 
});

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS configuration - Flexible for development and production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ✅ Additional CORS headers for broader compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ✅ Body parsing middleware with proper limits
app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ API Routes
app.use('/api/users', usersRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/packages', packageRoutes);

// ✅ Basic route with API information
app.get('/', (req, res) => {
  res.json({
    message: 'EV Charging Station API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      stations: '/api/stations',
      reservations: '/api/reservations',
      payments: '/api/payments',
      analytics: '/api/analytics',
      packages: '/api/packages'
    }
  });
});

// ✅ Enhanced Health check endpoint with database status
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

    // Test database connection
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('count')
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

// ✅ Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stations')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// ✅ Test registration endpoint for development
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

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ 404 handler (must be after all real routes)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ✅ Start server with detailed logging
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
