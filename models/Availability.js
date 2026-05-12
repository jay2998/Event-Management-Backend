const mongoose = require('mongoose');
const softDeletePlugin = require('../middlewares/softDelete');

/**
 * Availability blocks reserved time slots to prevent double-booking.
 *
 * resourceType: 'Hall' | 'Vehicle'
 * resourceId: ObjectId of the Hall/Vehicle document
 */
const availabilitySchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      required: true,
      enum: ['Hall', 'Vehicle'],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    // Date for this reservation
    date: {
      type: Date,
      required: true,
      index: true,
    },

    slotStartTime: {
      type: String,
      required: true,
      // HH:mm
    },
    slotEndTime: {
      type: String,
      required: true,
      // HH:mm
    },
    // Why is it blocked (booking reference if available)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    status: {
      type: String,
      required: true,
      enum: ['blocked', 'released'],
      default: 'blocked',
      index: true,
    },
  },
  { timestamps: true }
);

availabilitySchema.index({ resourceType: 1, resourceId: 1, date: 1, status: 1 });
availabilitySchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Availability', availabilitySchema);



