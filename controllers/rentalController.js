const { Service, User } = require('../models');
const { Op } = require('sequelize');

const getRentals = async (req, res) => {
  try {
    const { city, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    const where = { serviceType: 'rental' };

    if (req.user?.role === 'vendor') {
      where.vendorId = req.user.id;
    }

    if (city) where.city = city;
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice[Op.gte] = Number(minPrice);
      if (maxPrice) where.basePrice[Op.lte] = Number(maxPrice);
    }

    const { rows: rentals, count: total } = await Service.findAndCountAll({
      where,
      include: [{ model: User, as: 'vendor', attributes: ['name', 'email', 'phone'] }],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: rentals,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRental = async (req, res) => {
  try {
    const rental = await Service.findOne({
      where: { id: req.params.id, serviceType: 'rental' },
      include: [{ model: User, as: 'vendor', attributes: ['name', 'email', 'phone'] }],
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }

    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRental = async (req, res) => {
  try {
    const rental = await Service.create({
      ...req.body,
      serviceType: 'rental',
      vendorId: req.user.id,
    });

    res.status(201).json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateRental = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.maintenance) {
      updateData.maintenance = {
        ...updateData.maintenance,
        cost: Number(updateData.maintenance.cost || 0),
      };
      if (updateData.maintenance.status === 'completed' && !updateData.maintenance.completedDate) {
        updateData.maintenance.completedDate = new Date();
      }
    }

    if (updateData.damageReport) {
      updateData.damageReport = {
        ...updateData.damageReport,
        estimatedCost: Number(updateData.damageReport.estimatedCost || 0),
      };
    }

    const [updated] = await Service.update(updateData, {
      where: { id: req.params.id, vendorId: req.user.id, serviceType: 'rental' },
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }

    const rental = await Service.findByPk(req.params.id);
    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRental = async (req, res) => {
  try {
    const rental = await Service.findOne({
      where: { id: req.params.id, vendorId: req.user.id, serviceType: 'rental' },
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }

    await rental.softDelete();
    res.json({ success: true, message: 'Rental service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVendorRentals = async (req, res) => {
  try {
    const rentals = await Service.findAll({
      where: { vendorId: req.user.id, serviceType: 'rental' },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: rentals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addRentalItem = async (req, res) => {
  try {
    const rental = await Service.findOne({
      where: { id: req.params.id, vendorId: req.user.id, serviceType: 'rental' },
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }

    const items = rental.items || [];
    const newItem = { id: Date.now().toString(), ...req.body };
    items.push(newItem);

    await rental.update({ items });
    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateRentalItem = async (req, res) => {
  try {
    const rental = await Service.findOne({
      where: { id: req.params.id, vendorId: req.user.id, serviceType: 'rental' },
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }

    const items = rental.items || [];
    const itemIndex = items.findIndex(item => String(item.id) === req.params.itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    items[itemIndex] = { ...items[itemIndex], ...req.body };
    await rental.update({ items });
    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRentalItem = async (req, res) => {
  try {
    const rental = await Service.findOne({
      where: { id: req.params.id, vendorId: req.user.id, serviceType: 'rental' },
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }

    const items = (rental.items || []).filter(item => String(item.id) !== req.params.itemId);
    await rental.update({ items });
    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRentals, getRental, createRental, updateRental, deleteRental,
  getVendorRentals, addRentalItem, updateRentalItem, deleteRentalItem,
};
