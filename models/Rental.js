const mongoose = require('mongoose');
const softDeletePlugin = require('../middlewares/softDelete');
const Service = require('./Service');

const rentalItemSchema = new mongoose.Schema(

  {
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Tables', 'Chairs', 'Linens', 'Decor', 'Lighting', 'Sound', 'Tents', 'Flatware', 'Glassware', 'Other']
    },
    quantity: { type: Number, required: true, min: 1 },
    pricePerUnit: { type: Number, required: true },
    image: String
  },
  { _id: true }
);

const maintenanceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: false,
      trim: true
    },
    scheduledDate: {
      type: Date,
      required: false
    },
    completedDate: {
      type: Date,
      required: false
    },
    cost: {
      type: Number,
      required: false,
      default: 0,
      min: 0
    },
    notes: {
      type: String,
      required: false,
      trim: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed'],
      default: 'scheduled'
    }
  },
  { _id: false }
);

const damageReportSchema = new mongoose.Schema(
  {
    damageType: {
      type: String,
      required: false,
      trim: true
    },
    description: {
      type: String,
      required: false,
      trim: true
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe'],
      default: 'minor'
    },
    estimatedCost: {
      type: Number,
      required: false,
      default: 0,
      min: 0
    },
    photos: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const rentalSchema = new mongoose.Schema(
  {
    // Old model had a top-level name/description; those live in base schema.

    items: [rentalItemSchema],

    minimumOrderValue: { type: Number, default: 0 },
    deliveryAvailable: { type: Boolean, default: true },
    deliveryCharges: { type: Number, default: 0 },

    maintenance: {
      type: maintenanceSchema,
      required: false
    },

    damageReport: {
      type: damageReportSchema,
      required: false
    },

    // Rental was previously modeled separately and did not require basePrice.
    basePrice: { type: Number, required: false },

    // For parity with old schema; base already has rating/totalBookings/isAvailable.
  },
  { _id: false }
);


rentalSchema.plugin(softDeletePlugin);

const Rental = Service.discriminator('rental', rentalSchema);

module.exports = Rental;


