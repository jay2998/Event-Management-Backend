const mongoose = require('mongoose');
const softDeletePlugin = require('../middlewares/softDelete');
const Service = require('./Service');

const vehicleSchema = new mongoose.Schema(

  {
    // Old model had unique vehicleNumber.
    vehicleNumber: {
      type: String,
      required: true,
      unique: true
    },

    type: {
      type: String,
      enum: ['car', 'sedan', 'suv', 'van', 'bus', 'luxury', 'decorated'],
      required: true
    },

    // Old model's required fields
    capacity: {
      type: Number,
      required: true
    },
    farePerKm: {
      type: Number,
      required: true
    },
    perDayCharge: {
      type: Number,
      required: true
    },

    features: [String],
    images: [String],

    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'maintenance'],
      default: 'good'
    },
    insuranceExpiry: Date,
    lastServiceDate: Date,
    nextServiceDate: Date
  },
  { _id: false }
);

vehicleSchema.plugin(softDeletePlugin);

const Vehicle = Service.discriminator('vehicle', vehicleSchema);

module.exports = Vehicle;
