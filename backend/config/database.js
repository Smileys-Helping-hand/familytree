const { Sequelize } = require('sequelize');

const isTestEnv = process.env.NODE_ENV === 'test';

// Create Sequelize instance for Neon PostgreSQL
const databaseUrl = process.env.DATABASE_URL;
const fallbackDatabaseUrl = 'postgresql://invalid:invalid@localhost:5432/invalid';

const sequelize = isTestEnv
  ? new Sequelize('sqlite::memory:', {
      logging: false
    })
  : new Sequelize(databaseUrl || fallbackDatabaseUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 8000
      },
      logging: false, // Set to console.log to see SQL queries
      pool: {
        max: 5,
        min: 0,
        acquire: 8000,
        idle: 10000
      }
    });

// Test connection
const testConnection = async () => {
  try {
    if (!isTestEnv && !databaseUrl) {
      console.error('❌ Database connection error: DATABASE_URL is not set');
      return false;
    }

    await sequelize.authenticate();
    console.log(isTestEnv ? '✅ SQLite connected successfully' : '✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
