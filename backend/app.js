require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const familyRoutes = require('./routes/families');
const memberRoutes = require('./routes/members');
const memoryRoutes = require('./routes/memories');
const eventRoutes = require('./routes/events');
const activityRoutes = require('./routes/activity');

const buildAllowedOrigins = () => {
  const raw = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  });
  app.use('/api/', limiter);

  // CORS
  const allowedOrigins = buildAllowedOrigins();
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }));

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  if (process.env.NODE_ENV !== 'test') {
    console.log('📝 Using PostgreSQL as primary database');
  }

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/families', familyRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/memories', memoryRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/activity', activityRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Error handling middleware for API routes
  app.use('/api/*', (err, req, res, next) => {
    console.error('Error:', err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';

    res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  return app;
};

module.exports = { createApp };
