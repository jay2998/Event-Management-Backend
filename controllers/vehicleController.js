const Vehicle = require('../models/Vehicle');

// Get all vehicles
const getVehicles = async (req, res) => {
  try {
    const { type, isAvailable, page = 1, limit = 20 } = req.query;

    const query = {};

    // Strict multi-tenancy: vendors only see their own records
    if (req.user?.role === 'vendor') {
      query.vendorId = req.user._id || req.user.id;
    }

    if (type) {
      query.type = type;
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    const vehicles = await Vehicle.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      data: vehicles,
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

// Get single vehicle
const getVehicle = async (req, res) => {
  try {
    const filter = req.user?.role === 'vendor' ? { _id: req.params.id, vendorId: req.user._id || req.user.id } : { _id: req.params.id };
    const vehicle = await Vehicle.findOne(filter);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create vehicle (vendor only)
const createVehicle = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const imagePaths = req.files ? req.files.map(file => `/uploads/vehicles/${file.filename}`) : [];
    
    const payload = {
      ...req.body,
      images: imagePaths,
      // Strict multi-tenancy: vendor assigns itself
      ...(req.user?.role === 'vendor' ? { vendorId: userId } : { vendorId: req.body.vendorId || userId })
    };

    // Ensure features is an array if sent as a comma-separated string via FormData
    if (typeof payload.features === 'string') {
      payload.features = payload.features.split(',').map(f => f.trim()).filter(f => f);
    }

    const vehicle = new Vehicle(payload);
    
    await vehicle.save();
    
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const filter = req.user?.role === 'vendor' ? { _id: req.params.id, vendorId: req.user._id || req.user.id } : { _id: req.params.id };
    
    const updateData = { ...req.body };
    
    // If multer processed the 'images' field (i.e., req.files is defined),
    // then update the images array. If req.files is an empty array (no new files uploaded),
    // this will explicitly set the vehicle's images to an empty array, effectively clearing them.
    if (req.files) {
      updateData.images = req.files.map(file => `/uploads/vehicles/${file.filename}`);
    }

    if (typeof updateData.features === 'string') {
      updateData.features = updateData.features.split(',').map(f => f.trim()).filter(f => f);
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const filter = req.user?.role === 'vendor' ? { _id: req.params.id, vendorId: req.user._id || req.user.id } : { _id: req.params.id };
    const vehicle = await Vehicle.findOne(filter);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    await vehicle.softDelete();

    res.json({ success: true, message: 'Vehicle deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update vehicle availability
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const filter = req.user?.role === 'vendor' ? { _id: req.params.id, vendorId: req.user._id || req.user.id } : { _id: req.params.id };
    const vehicle = await Vehicle.findOneAndUpdate(
      filter,
      { isAvailable },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update vehicle condition
const updateCondition = async (req, res) => {
  try {
    const { condition } = req.body;

    const filter = req.user?.role === 'vendor' ? { _id: req.params.id, vendorId: req.user._id || req.user.id } : { _id: req.params.id };
    const vehicle = await Vehicle.findOneAndUpdate(
      filter,
      { condition, lastServiceDate: new Date() },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateAvailability,
  updateCondition
};
