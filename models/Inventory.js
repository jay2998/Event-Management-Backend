const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['furniture', 'equipment', 'decor', 'lighting', 'audio', 'tableware'],
    required: true
  },
  city: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  available: {
    type: Number,
    required: true,
    default: 0
  },
  reserved: {
    type: Number,
    default: 0
  },
  damaged: {
    type: Number,
    default: 0
  },
  condition: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor'],
    default: 'good'
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  image: String,
  description: String,
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema);
