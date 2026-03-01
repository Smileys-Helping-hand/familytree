require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createApp } = require('./app');
const { testConnection } = require('./config/database');

let app;
let initialized = false;

async function initializeApp() {
  if (initialized) return app;
  const { syncDatabase } = require('./models/index');
  app = createApp();
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
    initialized = true;
  } catch (error) {
    if (app && app.locals && app.locals.startupStatus) {
      app.locals.startupStatus.lastError = error.message;
    }
    throw error;
  }
  return app;
}

// For Vercel / serverless: export handler function
module.exports = async (req, res) => {
  if (!initialized) {
    await initializeApp();
  }
  return app(req, res);
};

// For local development: start HTTP server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  initializeApp()
    .then((appInstance) => {
      appInstance.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
      });
    })
    .catch((error) => {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });
}

