const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PaymentHistory = sequelize.define('PaymentHistory', {
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
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('card', 'bank_transfer', 'easypaisa', 'jazzcash', 'cash'),
    allowNull: false,
  },
}, {
  tableName: 'payment_history',
  timestamps: false,
});

module.exports = PaymentHistory;
