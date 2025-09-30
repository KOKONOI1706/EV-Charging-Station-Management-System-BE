import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import stationRoutes from './routes/stations.js';
import bookingRoutes from './routes/bookings.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Import Supabase để test connection
    const { supabase } = await import('./config/supabase.js');
    
    // Test database connection
    const { data, error } = await supabase
      .from('roles')
      .select('count')
      .limit(1);

    const healthStatus = {
      status: 'OK',
      message: 'EV Charging Backend is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: error ? 'ERROR' : 'CONNECTED',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    if (error) {
      healthStatus.status = 'DEGRADED';
      healthStatus.database_error = error.message;
      return res.status(503).json(healthStatus);
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