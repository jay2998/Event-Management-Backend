const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('furniture', 'equipment', 'decor', 'lighting', 'audio', 'tableware'),
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  available: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  reserved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  damaged: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  condition: {
    type: DataTypes.ENUM('new', 'good', 'fair', 'poor'),
    defaultValue: 'good',
  },
  pricePerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'inventory',
  timestamps: true,
});

module.exports = Inventory;
