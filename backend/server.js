require('dotenv').config();
const { createApp } = require('./app');
const { testConnection } = require('./config/database');

let app;
let initialized = false;

async function initializeApp() {
  if (initialized) return;
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
    app.locals.startupStatus.lastError = error.message;
    throw error;
  }
}

module.exports = async (req, res) => {
  if (!initialized) {
    await initializeApp();
  }
  return app(req, res);
};

module.exports = app;
