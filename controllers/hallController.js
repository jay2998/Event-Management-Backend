const Hall = require('../models/Hall');

// Get all halls with filtering
const getHalls = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, capacity, page = 1, limit = 20 } = req.query;
    
    const query = { isAvailable: true };

    // Strict multi-tenancy: vendors only see their own records
    if (req.user?.role === 'vendor') {
      query.vendorId = req.user.id;
    }
    
    if (city) {
      query.city = city;
    }
    
    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
    }
    
    if (capacity) {
      query.capacity = { $gte: Number(capacity) };
    }
    
    const halls = await Hall.find(query)
      .populate('vendorId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Hall.countDocuments(query);
    
    res.json({
      success: true,
      data: halls,
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

// Get single hall
const getHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id).populate('vendorId', 'name email phone');
    
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }
    
    res.json({ success: true, data: hall });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create hall (vendor only)
const createHall = async (req, res) => {
  try {
    const hall = new Hall({
      ...req.body,
      vendorId: req.user.id
    });
    
    await hall.save();
    
    res.status(201).json({ success: true, data: hall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update hall
const updateHall = async (req, res) => {
  try {
    const hall = await Hall.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }
    
    res.json({ success: true, data: hall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete hall
const deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }
    await hall.softDelete();

    res.json({ success: true, message: 'Hall deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get vendor's halls
const getVendorHalls = async (req, res) => {
  try {
    const halls = await Hall.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: halls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHalls,
  getHall,
  createHall,
  updateHall,
  deleteHall,
  getVendorHalls
};
