const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  serviceType: {
    type: DataTypes.ENUM('hall', 'catering', 'rental', 'vehicle'),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending',
  },
  basePrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  amenities: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
  },
  totalBookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  eventDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  // Hall-specific fields
  address: { type: DataTypes.STRING, allowNull: true },
  capacity: { type: DataTypes.INTEGER, allowNull: true },
  pricePerHour: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  // Vehicle-specific fields
  vehicleNumber: { type: DataTypes.STRING, allowNull: true, unique: true },
  vehicleType: {
    type: DataTypes.ENUM('car', 'sedan', 'suv', 'van', 'bus', 'luxury', 'decorated'),
    allowNull: true,
  },
  farePerKm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  perDayCharge: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  features: { type: DataTypes.JSON, allowNull: true },
  vehicleCondition: {
    type: DataTypes.ENUM('excellent', 'good', 'fair', 'maintenance'),
    defaultValue: 'good',
  },
  insuranceExpiry: { type: DataTypes.DATEONLY, allowNull: true },
  lastServiceDate: { type: DataTypes.DATEONLY, allowNull: true },
  nextServiceDate: { type: DataTypes.DATEONLY, allowNull: true },
  // Rental-specific fields
  items: { type: DataTypes.JSON, allowNull: true },
  minimumOrderValue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  deliveryAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
  deliveryCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  maintenance: { type: DataTypes.JSON, allowNull: true },
  damageReport: { type: DataTypes.JSON, allowNull: true },
  // Soft delete
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'services',
  timestamps: true,
  defaultScope: {
    where: { isDeleted: false },
  },
  scopes: {
    withDeleted: { where: {} },
  },
});

Service.prototype.softDelete = async function () {
  this.isDeleted = true;
  await this.save();
};

module.exports = Service;
