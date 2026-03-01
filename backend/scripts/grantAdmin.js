/**
 * One-time script: grant premium + admin to a user by email
 * Usage: node backend/scripts/grantAdmin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../config/database');
const { User } = require('../models/index');

const TARGET_EMAIL = 'mraaziqp@gmail.com';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    const [count] = await User.update(
      { subscription: 'premium', role: 'admin' },
      { where: { email: TARGET_EMAIL } }
    );

    if (count === 0) {
      console.error(`❌ No user found with email: ${TARGET_EMAIL}`);
      console.log('Make sure the account is registered first, then re-run this script.');
    } else {
      console.log(`✅ Updated ${TARGET_EMAIL} → subscription: premium, role: admin`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
