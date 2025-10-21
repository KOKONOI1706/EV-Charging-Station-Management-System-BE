import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './supabase/client.js';

// Import routes
import usersRouter from './routes/users.js';
import stationsRouter from './routes/stations.js';
import reservationsRouter from './routes/reservations.js';
import paymentsRouter from './routes/payments.js';
import analyticsRouter from './routes/analytics.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/analytics', analyticsRouter);

// Basic route
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
      analytics: '/api/analytics'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Test database connection
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   • POST /api/users/register`);
  console.log(`   • POST /api/users/login`);
  console.log(`   • GET  /api/stations`);
  console.log(`   • POST /api/reservations`);
  console.log(`   • POST /api/payments/create-session`);
  console.log(`   • GET  /api/analytics/overview`);
});