const mongoose = require('mongoose');

// Shared schema for all bookable services/vendored inventory.
// NOTE: This is intended to be used via Mongoose discriminators.
const serviceBaseSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Discriminator key: hall | catering | rental | vehicle
    serviceType: {
      type: String,
      required: true,
      enum: ['hall', 'catering', 'rental', 'vehicle']
    },

    // Optional subcategory used by catering/menu and service searches.
    category: {
      type: String,
      required: false,
      trim: true
    },

    // Generic workflow status used by catering quality checks and similar flows.
    status: {
      type: String,
      required: false,
      trim: true,
      default: 'Pending'
    },

    // Optional event date for catering orders and inspections.
    eventDate: {
      type: Date,
      required: false
    },

    // Optional list of items for catering order tracking and quality review pages.
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: false, default: 0 },
        quantity: { type: Number, required: false, default: 1 },
        category: { type: String, required: false, trim: true }
      }
    ],

    // Optional assessment payload for catering quality review pages.
    qualityCheck: {
      appearance: { type: String, required: false, trim: true },
      taste: { type: String, required: false, trim: true },
      temperature: { type: String, required: false, trim: true },
      plating: { type: String, required: false, trim: true },
      notes: { type: String, required: false, trim: true },
      updatedAt: { type: Date, required: false },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
      }
    },

    name: {
      type: String,
      required: true
    },

    description: String,

    city: {
      type: String,
      required: true,
      enum: ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Other']
    },

    // Some frontends/services reference basePrice even if not all subtypes use it.
    basePrice: {
      type: Number,
      required: false
    },

    images: [String],
    amenities: [String],

    isAvailable: {
      type: Boolean,
      default: true
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    totalBookings: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    discriminatorKey: 'serviceType',
    collection: 'services'
  }
);

module.exports = { serviceBaseSchema };


