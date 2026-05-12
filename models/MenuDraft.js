const mongoose = require('mongoose');

const menuDraftItemSchema = new mongoose.Schema(
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
      min: 1
    },
    category: {
      type: String,
      required: false,
      trim: true
    },
    description: {
      type: String,
      required: false,
      trim: true
    }
  },
  { _id: false }
);

const menuDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false,
      default: null,
      index: true
    },
    guestCount: {
      type: Number,
      required: false,
      default: null
    },
    items: {
      type: [menuDraftItemSchema],
      default: []
    },
    totalPrice: {
      type: Number,
      required: false,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['draft', 'saved'],
      default: 'draft'
    }
  },
  { timestamps: true }
);

menuDraftSchema.index({ userId: 1, bookingId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('MenuDraft', menuDraftSchema);
