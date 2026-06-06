const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  eventName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  eventDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hall: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'services', key: 'id' },
  },
  package: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  eventTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guestCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  taxAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
    defaultValue: 'unpaid',
  },
  advancePaid: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'bookings',
  timestamps: true,
  defaultScope: {
    where: { isDeleted: false },
  },
  scopes: {
    withDeleted: { where: {} },
  },
});

Booking.prototype.softDelete = async function () {
  this.isDeleted = true;
  await this.save();
};

module.exports = Booking;
