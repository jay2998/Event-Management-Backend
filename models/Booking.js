const mongoose = require('mongoose');
const softDeletePlugin = require('../middlewares/softDelete');

// NOTE: Availability model is used to block double-booked time slots.
const Availability = require('./Availability');

const bookingItemSchema = new mongoose.Schema(

  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },

    // Price snapshot at the time of booking
    priceAtBooking: {
      type: Number,
      required: true,
      min: 0,
      max: 10000000
    },

    // Date/time slot reserved for this sub-service
    slotDate: {
      type: Date,
      required: true
    },
    slotStartTime: {
      type: String,
      required: true
    },
    slotEndTime: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const bookingMenuItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: false,
      trim: true
    }
  },
  { _id: false }
);

const paymentHistorySchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      max: 10000000
    },
    paidAt: {
      type: Date,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['card', 'bank_transfer', 'easypaisa', 'jazzcash', 'cash']
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    eventName: {
      type: String,
      required: true
    },

    eventDate: {
      type: Date,
      required: true
    },

    customerName: {
      type: String,
      required: false,
      trim: true
    },

    customerEmail: {
      type: String,
      required: false,
      trim: true
    },

    customerPhone: {
      type: String,
      required: false,
      trim: true
    },

    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: false
    },

    package: {
      type: String,
      required: false,
      trim: true
    },

    eventTime: {
      type: String,
      required: false,
      trim: true
    },

    // Optional top-level time window (kept for backward compatibility / UI needs)
    startTime: {
      type: String,
      required: false
    },
    endTime: {
      type: String,
      required: false
    },

    guestCount: {
      type: Number,
      required: true,
      min: 1,
      max: 100000
    },

    // Multi-service checkout items
    items: {
      type: [bookingItemSchema],
      required: true,
      validate: [arr => Array.isArray(arr) && arr.length > 0, 'At least one item is required']
    },

    taxAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 5000000
    },

    discountAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 5000000
    },

    // Computed totals
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      max: 50000000
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending'
    },

    notes: String,

    // Derived from paymentHistory
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid'
    },

    // Derived from paymentHistory
    advancePaid: {
      type: Number,
      default: 0,
      min: 0,
      max: 50000000
    },

    paymentHistory: {
      type: [paymentHistorySchema],
      default: []
    },

    menuItems: {
      type: [bookingMenuItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Keep paymentStatus/advancePaid in sync with paymentHistory
bookingSchema.pre('validate', function () {
  const totalPaid = (this.paymentHistory || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

  this.advancePaid = totalPaid;

  if (totalPaid <= 0) {
    this.paymentStatus = 'unpaid';
  } else if (this.totalAmount != null && totalPaid >= Number(this.totalAmount)) {
    this.paymentStatus = 'paid';
  } else {
    this.paymentStatus = 'partial';
  }
});

bookingSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Booking', bookingSchema);
