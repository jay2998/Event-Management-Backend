const Inventory = require('../models/Inventory');

// Get inventory items (vendor sees only their own unless admin)
const getInventory = async (req, res) => {
  try {
    const { city, category, search, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    const query = {};

    if (req.user?.role === 'vendor') {
      query.vendorId = req.user.id;
    }

    if (city) query.city = city;
    if (category) query.category = category;

    if (search) {
      query.name = { $regex: String(search).trim(), $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
    }

    const items = await Inventory.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Inventory.countDocuments(query);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInventoryItem = async (req, res) => {
  try {
    const filter = req.user?.role === 'vendor'
      ? { _id: req.params.id, vendorId: req.user.id }
      : { _id: req.params.id };

    const item = await Inventory.findOne(filter);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

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
      vendorId: req.user?.role === 'vendor' ? userId : (req.body.vendorId || userId)
    };

    // sensible defaults
    if (payload.quantity === undefined) payload.quantity = 0;
    if (payload.available === undefined) payload.available = payload.quantity;
    if (payload.reserved === undefined) payload.reserved = 0;
    if (payload.damaged === undefined) payload.damaged = 0;

    const item = new Inventory(payload);
    await item.save();

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const filter = req.user?.role === 'vendor'
      ? { _id: req.params.id, vendorId: req.user.id }
      : { _id: req.params.id };

    const updateData = { ...req.body };

    if (updateData.available !== undefined) updateData.available = Number(updateData.available);
    if (updateData.reserved !== undefined) updateData.reserved = Number(updateData.reserved);
    if (updateData.damaged !== undefined) updateData.damaged = Number(updateData.damaged);

    const item = await Inventory.findOneAndUpdate(filter, updateData, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const filter = req.user?.role === 'vendor'
      ? { _id: req.params.id, vendorId: req.user.id }
      : { _id: req.params.id };

    const item = await Inventory.findOne(filter);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    // No softDelete middleware on Inventory model, so hard delete for now
    await Inventory.deleteOne({ _id: req.params.id });

    res.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
};

