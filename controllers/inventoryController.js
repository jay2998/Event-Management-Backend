const { Inventory } = require('../models');
const { Op } = require('sequelize');

const getInventory = async (req, res) => {
  try {
    const { city, category, search, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    const where = {};

    if (req.user?.role === 'vendor') where.vendorId = req.user.id;
    if (city) where.city = city;
    if (category) where.category = category;
    if (search) where.name = { [Op.like]: `%${search.trim()}%` };
    if (minPrice || maxPrice) {
      where.pricePerUnit = {};
      if (minPrice) where.pricePerUnit[Op.gte] = Number(minPrice);
      if (maxPrice) where.pricePerUnit[Op.lte] = Number(maxPrice);
    }

    const { rows: items, count: total } = await Inventory.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: items,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInventoryItem = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user?.role === 'vendor') where.vendorId = req.user.id;

    const item = await Inventory.findOne({ where });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createInventoryItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    const payload = {
      ...req.body,
      vendorId: req.user?.role === 'vendor' ? userId : (req.body.vendorId || userId),
    };

    if (payload.quantity === undefined) payload.quantity = 0;
    if (payload.available === undefined) payload.available = payload.quantity;
    if (payload.reserved === undefined) payload.reserved = 0;
    if (payload.damaged === undefined) payload.damaged = 0;

    const item = await Inventory.create(payload);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user?.role === 'vendor') where.vendorId = req.user.id;

    const updateData = { ...req.body };
    if (updateData.available !== undefined) updateData.available = Number(updateData.available);
    if (updateData.reserved !== undefined) updateData.reserved = Number(updateData.reserved);
    if (updateData.damaged !== undefined) updateData.damaged = Number(updateData.damaged);

    const [updated] = await Inventory.update(updateData, { where });
    if (!updated) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const item = await Inventory.findByPk(req.params.id);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user?.role === 'vendor') where.vendorId = req.user.id;

    const item = await Inventory.findOne({ where });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    await Inventory.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInventory, getInventoryItem, createInventoryItem, updateInventoryItem, deleteInventoryItem,
};
