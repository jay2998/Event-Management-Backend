const Rental = require('../models/Rental');

// Get all rentals with filtering
const getRentals = async (req, res) => {
  try {
    const { city, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    
    const query = {};

    // Strict multi-tenancy: vendors only see their own records
    if (req.user?.role === 'vendor') {
      query.vendorId = req.user.id;
    }
    
    if (city) {
      query.city = city;
    }
    
    if (category) {
      query['items.category'] = category;
    }
    
    if (minPrice || maxPrice) {
      query['items.pricePerUnit'] = {};
      if (minPrice) query['items.pricePerUnit'].$gte = Number(minPrice);
      if (maxPrice) query['items.pricePerUnit'].$lte = Number(maxPrice);
    }
    
    const rentals = await Rental.find(query)
      .populate('vendorId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Rental.countDocuments(query);
    
    res.json({
      success: true,
      data: rentals,
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

// Get single rental
const getRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('vendorId', 'name email phone');
    
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }
    
    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create rental (vendor only)
const createRental = async (req, res) => {
  try {
    const rental = new Rental({
      ...req.body,
      vendorId: req.user.id
    });
    
    await rental.save();
    
    res.status(201).json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update rental
const updateRental = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.maintenance) {
      updateData.maintenance = {
        ...updateData.maintenance,
        cost: Number(updateData.maintenance.cost || 0)
      };

      if (updateData.maintenance.status === 'completed' && !updateData.maintenance.completedDate) {
        updateData.maintenance.completedDate = new Date();
      }
    }

    if (updateData.damageReport) {
      updateData.damageReport = {
        ...updateData.damageReport,
        estimatedCost: Number(updateData.damageReport.estimatedCost || 0)
      };
    }

    const rental = await Rental.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }
    
    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete rental
const deleteRental = async (req, res) => {
  try {
    const rental = await Rental.findOne({ _id: req.params.id, vendorId: req.user.id });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }

    await rental.softDelete();

    res.json({ success: true, message: 'Rental service deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get vendor's rentals
const getVendorRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: rentals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add rental item
const addRentalItem = async (req, res) => {
  try {
    const rental = await Rental.findOne({ _id: req.params.id, vendorId: req.user.id });
    
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }
    
    rental.items.push(req.body);
    await rental.save();
    
    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update rental item
const updateRentalItem = async (req, res) => {
  try {
    const rental = await Rental.findOne({ _id: req.params.id, vendorId: req.user.id });
    
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }
    
    const itemIndex = rental.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    rental.items[itemIndex] = { ...rental.items[itemIndex].toObject(), ...req.body };
    await rental.save();
    
    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete rental item
const deleteRentalItem = async (req, res) => {
  try {
    const rental = await Rental.findOne({ _id: req.params.id, vendorId: req.user.id });
    
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }
    
    rental.items = rental.items.filter(
      item => item._id.toString() !== req.params.itemId
    );
    await rental.save();
    
    res.json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRentals,
  getRental,
  createRental,
  updateRental,
  deleteRental,
  getVendorRentals,
  addRentalItem,
  updateRentalItem,
  deleteRentalItem
};
