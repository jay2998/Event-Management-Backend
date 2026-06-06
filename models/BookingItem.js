const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BookingItem = sequelize.define('BookingItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'bookings', key: 'id' },
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'services', key: 'id' },
  },
  priceAtBooking: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  slotDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  slotStartTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slotEndTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'booking_items',
  timestamps: false,
});

module.exports = BookingItem;
