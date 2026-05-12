const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Service = require('../models/Service');

// Dedicated Search and Filter Endpoint
router.get('/search', async (req, res) => {
  try {
    const { q, vendorId, category, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Initialize the aggregation pipeline
    let pipeline = [];

    // 1. Atlas Search Stage (MUST be first)
    // Note: Requires a Search Index named "default" in MongoDB Atlas
    if (q) {
      pipeline.push({
        $search: {
          index: 'default',
          text: {
            query: q,
            path: ['name', 'description'],
            fuzzy: { maxEdits: 1 }
          }
        }
      });
    }

    // 2. Standard Filters (Soft Deletes and ID matches)
    // This ensures that even in search results, deleted items are hidden
    let matchQuery = { isDeleted: { $ne: true } };

    if (vendorId) matchQuery.vendorId = new mongoose.Types.ObjectId(vendorId);
    if (category) matchQuery.category = category;
    
    // fall back to regex if q is provided but Atlas Search is not configured
    if (q && pipeline.length === 0) {
      matchQuery.name = { $regex: q, $options: 'i' };
    }

    pipeline.push({ $match: matchQuery });

    // 3. Pagination Stages
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // 4. Populate Vendor Info
    const services = await Service.aggregate(pipeline);
    await Service.populate(services, { path: 'vendorId', select: 'name email' });

    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;