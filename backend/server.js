require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { sequelize, testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const familyRoutes = require('./routes/families');
const memberRoutes = require('./routes/members');
const memoryRoutes = require('./routes/memories');
const eventRoutes = require('./routes/events');
const activityRoutes = require('./routes/activity');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Database connections (keeping MongoDB for backward compatibility)
// PostgreSQL connection (primary)
testConnection();

// MongoDB connection (optional fallback)
if (process.env.NODE_ENV !== 'test') {
  if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb://localhost:27017/familytree') {
    mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
      console.log('⚠️  MongoDB not connected (using PostgreSQL)');
    });
  } else {
    console.log('📝 Using PostgreSQL as primary database');
  }
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

// Serve static files from frontend build
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  
  // Serve frontend for all non-API routes (SPA fallback)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // In development, let Vite handle the frontend
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API Server Running',
      frontend: 'Run the frontend with: npm run dev:frontend'
    });
  });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  const { syncDatabase } = require('./models/index');
  await syncDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
