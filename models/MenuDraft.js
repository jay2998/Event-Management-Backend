const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MenuDraft = sequelize.define('MenuDraft', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'bookings', key: 'id' },
  },
  guestCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('draft', 'saved'),
    defaultValue: 'draft',
  },
}, {
  tableName: 'menu_drafts',
  timestamps: true,
});

module.exports = MenuDraft;
