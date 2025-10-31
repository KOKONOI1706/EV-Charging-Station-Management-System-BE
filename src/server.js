import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import usersRouter from './routes/users.js';
import stationsRouter from './routes/stations.js';
import bookingsRouter from './routes/bookings.js';
import chargingPointsRouter from './routes/chargingPoints.js';
import chargingSessionsRouter from './routes/chargingSessions.js';
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

// ✅ API Routes
app.use('/api/users', usersRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/charging-points', chargingPointsRouter);
app.use('/api/charging-sessions', chargingSessionsRouter);
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
      bookings: '/api/bookings',
      chargingPoints: '/api/charging-points',
      chargingSessions: '/api/charging-sessions',
      payments: '/api/payments',
      analytics: '/api/analytics',
      packages: '/api/packages'
    }
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
  console.log(`📋 Available endpoints:`);
  console.log(`   • POST /api/users/register`);
  console.log(`   • POST /api/users/login`);
  console.log(`   • GET  /api/stations`);
  console.log(`   • POST /api/bookings`);
  console.log(`   • PUT  /api/bookings/:id/status`);
  console.log(`   • GET  /api/charging-points`);
  console.log(`   • PUT  /api/charging-points/:id/status`);
  console.log(`   • POST /api/charging-sessions`);
  console.log(`   • PUT  /api/charging-sessions/:id/stop`);
  console.log(`   • POST /api/payments/create-session`);
  console.log(`   • GET  /api/analytics/overview`);
  console.log(`   • GET  /api/packages`);
});

export default app;