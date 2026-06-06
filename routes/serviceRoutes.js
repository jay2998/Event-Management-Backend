const express = require('express');
const router = express.Router();
const { Service } = require('../models');
const { Op } = require('sequelize');

router.get('/search', async (req, res) => {
  try {
    const { q, vendorId, category, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { isDeleted: false };

    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    if (vendorId) where.vendorId = vendorId;
    if (category) where.category = category;

    const { rows: services, count: total } = await Service.findAndCountAll({
      where,
      include: [{ association: 'vendor', attributes: ['name', 'email'] }],
      offset: skip,
      limit: parseInt(limit),
    });

    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
