const { Sequelize } = require('sequelize');

const isTestEnv = process.env.NODE_ENV === 'test';

// Create Sequelize instance for Neon PostgreSQL
const databaseUrl = process.env.DATABASE_URL;

const sequelize = isTestEnv
  ? new Sequelize('sqlite::memory:', {
      logging: false
    })
  : new Sequelize(databaseUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false, // Set to console.log to see SQL queries
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

// Test connection
const testConnection = async () => {
  try {
    if (!isTestEnv && !databaseUrl) {
      throw new Error('DATABASE_URL is not set');
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
