
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Memory = sequelize.define('Memory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  memberId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'family_members',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('photo', 'story', 'event'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  mediaUrl: {
    type: DataTypes.STRING
  },
  date: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  tableName: 'memories'
});

module.exports = Memory;
