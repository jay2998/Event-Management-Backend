const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Availability = sequelize.define('Availability', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  resourceType: {
    type: DataTypes.ENUM('Hall', 'Vehicle'),
    allowNull: false,
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
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
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'bookings', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM('blocked', 'released'),
    defaultValue: 'blocked',
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'availability',
  timestamps: true,
  defaultScope: {
    where: { isDeleted: false },
  },
  scopes: {
    withDeleted: { where: {} },
  },
});

Availability.prototype.softDelete = async function () {
  this.isDeleted = true;
  await this.save();
};

module.exports = Availability;
