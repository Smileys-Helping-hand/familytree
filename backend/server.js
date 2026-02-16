require('dotenv').config();
const { createApp } = require('./app');
const { testConnection } = require('./config/database');

const app = createApp();
const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  const { syncDatabase } = require('./models/index');
  await testConnection();
  await syncDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  });
};

if (require.main === module && process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
