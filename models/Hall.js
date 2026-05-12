const mongoose = require('mongoose');
const softDeletePlugin = require('../middlewares/softDelete');
const Service = require('./Service');

const hallSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true
    },
    capacity: {
      type: Number,
      required: true
    },
    pricePerHour: {
      type: Number,
      required: true
    },

    // keeping parity with old model; not required but useful.
    images: [String],
    amenities: [String]
  },
  { _id: false }
);

hallSchema.plugin(softDeletePlugin);

// Register discriminator under Service.
const Hall = Service.discriminator('hall', hallSchema);

module.exports = Hall;



