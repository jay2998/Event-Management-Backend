const { Service, User } = require('../models');
const { Op } = require('sequelize');

const getHalls = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, capacity, page = 1, limit = 20 } = req.query;
    const where = { serviceType: 'hall', isAvailable: true };

    if (req.user?.role === 'vendor') {
      where.vendorId = req.user.id;
    }

    if (city) where.city = city;
    if (capacity) where.capacity = { [Op.gte]: Number(capacity) };
    if (minPrice || maxPrice) {
      where.pricePerHour = {};
      if (minPrice) where.pricePerHour[Op.gte] = Number(minPrice);
      if (maxPrice) where.pricePerHour[Op.lte] = Number(maxPrice);
    }

    const { rows: halls, count: total } = await Service.findAndCountAll({
      where,
      include: [{ model: User, as: 'vendor', attributes: ['name', 'email', 'phone'] }],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: halls,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHall = async (req, res) => {
  try {
    const hall = await Service.findOne({
      where: { id: req.params.id, serviceType: 'hall' },
      include: [{ model: User, as: 'vendor', attributes: ['name', 'email', 'phone'] }],
    });

    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }

    res.json({ success: true, data: hall });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createHall = async (req, res) => {
  try {
    const hall = await Service.create({
      ...req.body,
      serviceType: 'hall',
      vendorId: req.user.id,
    });

    res.status(201).json({ success: true, data: hall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateHall = async (req, res) => {
  try {
    const [updated] = await Service.update(req.body, {
      where: { id: req.params.id, vendorId: req.user.id, serviceType: 'hall' },
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }

    const hall = await Service.findByPk(req.params.id);
    res.json({ success: true, data: hall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteHall = async (req, res) => {
  try {
    const hall = await Service.findOne({
      where: { id: req.params.id, vendorId: req.user.id, serviceType: 'hall' },
    });

    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }

    await hall.softDelete();
    res.json({ success: true, message: 'Hall deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVendorHalls = async (req, res) => {
  try {
    const halls = await Service.findAll({
      where: { vendorId: req.user.id, serviceType: 'hall' },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: halls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getHalls, getHall, createHall, updateHall, deleteHall, getVendorHalls };
