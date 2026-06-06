const { Service } = require('../models');
const { Op } = require('sequelize');

const getVehicles = async (req, res) => {
  try {
    const { type, isAvailable, page = 1, limit = 20 } = req.query;
    const where = { serviceType: 'vehicle' };

    if (req.user?.role === 'vendor') {
      where.vendorId = req.user.id;
    }

    if (type) where.vehicleType = type;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';

    const { rows: vehicles, count: total } = await Service.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: vehicles,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVehicle = async (req, res) => {
  try {
    const where = { id: req.params.id, serviceType: 'vehicle' };
    if (req.user?.role === 'vendor') where.vendorId = req.user.id;

    const vehicle = await Service.findOne({ where });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createVehicle = async (req, res) => {
  try {
    const userId = req.user?.id;
    const imagePaths = req.files ? req.files.map(file => `/uploads/vehicles/${file.filename}`) : [];

    const payload = {
      ...req.body,
      serviceType: 'vehicle',
      images: imagePaths,
      vendorId: req.user?.role === 'vendor' ? userId : (req.body.vendorId || userId),
    };

    if (typeof payload.features === 'string') {
      payload.features = payload.features.split(',').map(f => f.trim()).filter(f => f);
    }

    const vehicle = await Service.create(payload);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const where = { id: req.params.id, serviceType: 'vehicle' };
    if (req.user?.role === 'vendor') where.vendorId = req.user.id;

    const updateData = { ...req.body };

    if (req.files) {
      updateData.images = req.files.map(file => `/uploads/vehicles/${file.filename}`);
    }

    if (typeof updateData.features === 'string') {
      updateData.features = updateData.features.split(',').map(f => f.trim()).filter(f => f);
    }

    const [updated] = await Service.update(updateData, { where });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicle = await Service.findByPk(req.params.id);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const where = { id: req.params.id, serviceType: 'vehicle' };
    if (req.user?.role === 'vendor') where.vendorId = req.user.id;

    const vehicle = await Service.findOne({ where });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    await vehicle.softDelete();
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const where = { id: req.params.id, serviceType: 'vehicle' };
    if (req.user?.role === 'vendor') where.vendorId = req.user.id;

    const [updated] = await Service.update({ isAvailable }, { where });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicle = await Service.findByPk(req.params.id);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCondition = async (req, res) => {
  try {
    const { condition } = req.body;
    const where = { id: req.params.id, serviceType: 'vehicle' };
    if (req.user?.role === 'vendor') where.vendorId = req.user.id;

    const [updated] = await Service.update(
      { vehicleCondition: condition, lastServiceDate: new Date() },
      { where }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicle = await Service.findByPk(req.params.id);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getVehicles, getVehicle, createVehicle, updateVehicle,
  deleteVehicle, updateAvailability, updateCondition,
};
