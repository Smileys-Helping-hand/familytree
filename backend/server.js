require('dotenv').config();
const { createApp } = require('./app');
const { testConnection } = require('./config/database');

const app = createApp();
const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  const { syncDatabase } = require('./models/index');
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed during startup');
    }

    app.locals.startupStatus.dbConnected = true;
    await syncDatabase();
    app.locals.startupStatus.dbSynced = true;
    app.locals.startupStatus.initialized = true;
    app.locals.startupStatus.initializedAt = new Date().toISOString();
    app.locals.startupStatus.lastError = null;
  } catch (error) {
    app.locals.startupStatus.lastError = error.message;
    throw error;
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  });
};

if (require.main === module && process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });
}

module.exports = app;
