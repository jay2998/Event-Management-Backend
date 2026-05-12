const Service = require('../models/Service');
const MenuDraft = require('../models/MenuDraft');

const MENU_CATEGORIES = ['appetizers', 'mains', 'desserts', 'beverages'];
const CATEGORY_ALIASES = {
  appetizer: 'appetizers',
  appetizers: 'appetizers',
  main: 'mains',
  mains: 'mains',
  dessert: 'desserts',
  desserts: 'desserts',
  beverage: 'beverages',
  beverages: 'beverages',
  order: 'order'
};

const normalizeCategory = (value) => {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  return CATEGORY_ALIASES[normalized] || normalized;
};

const getUserId = (req) => req.user?._id || req.user?.id;

const normalizeDraftItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    id: String(item.id),
    name: item.name,
    price: Number(item.price || 0),
    quantity: Math.max(1, Number(item.quantity || 1)),
    category: item.category || 'appetizers',
    description: item.description || ''
  }));
};

const normalizeOrderItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    name: item.name,
    price: Number(item.price || 0),
    quantity: Math.max(1, Number(item.quantity || 1)),
    category: item.category || 'appetizers'
  }));
};

const buildMenuPayload = (body, userId) => {
  const normalizedCategory = normalizeCategory(body.category);
  const category = MENU_CATEGORIES.includes(normalizedCategory) ? normalizedCategory : MENU_CATEGORIES[0];

  return {
    ...body,
    serviceType: 'catering',
    category,
    name: body.name,
    description: body.description || '',
    city: body.city || 'Other',
    basePrice: Number(body.basePrice ?? body.price ?? 0),
    vendorId: userId,
    images: Array.isArray(body.images) ? body.images : body.images || [],
    amenities: Array.isArray(body.amenities) ? body.amenities : body.amenities || []
  };
};

const menuFilter = (req) => {
  const filter = {
    serviceType: 'catering',
    category: { $in: MENU_CATEGORIES }
  };

  if (req.user?.role === 'vendor') {
    filter.vendorId = getUserId(req);
  }

  return filter;
};

const orderFilter = (req) => {
  const filter = {
    serviceType: 'catering',
    category: 'order'
  };

  if (req.user?.role === 'vendor') {
    filter.vendorId = getUserId(req);
  }

  return filter;
};

// Get all catering menu items
const getCateringMenu = async (req, res) => {
  try {
    const services = await Service.find(menuFilter(req))
      .populate('vendorId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: services.map((service) => ({
        ...service.toObject(),
        category: normalizeCategory(service.category)
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCateringMenuItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    const payload = buildMenuPayload(req.body, userId);

    const item = new Service(payload);
    await item.save();

    res.status(201).json({
      success: true,
      data: {
        ...item.toObject(),
        category: normalizeCategory(item.category)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCateringMenuItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    const filter = { _id: req.params.id, serviceType: 'catering', category: { $in: MENU_CATEGORIES } };

    if (req.user?.role === 'vendor') {
      filter.vendorId = userId;
    }

    const updateData = buildMenuPayload(req.body, userId);
    const item = await Service.findOneAndUpdate(filter, updateData, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({
      success: true,
      data: {
        ...item.toObject(),
        category: normalizeCategory(item.category)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCateringMenuItem = async (req, res) => {
  try {
    const filter = { _id: req.params.id, serviceType: 'catering', category: { $in: MENU_CATEGORIES } };

    if (req.user?.role === 'vendor') {
      filter.vendorId = getUserId(req);
    }

    const item = await Service.findOne(filter);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    await item.softDelete();
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all catering orders
const getCateringOrders = async (req, res) => {
  try {
    const orders = await Service.find(orderFilter(req))
      .populate('vendorId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create catering order
const createCateringOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const order = new Service({
      ...req.body,
      name: req.body.name || req.body.eventName || 'Catering Order',
      serviceType: 'catering',
      category: 'order',
      vendorId: userId,
      city: req.body.city || 'Other',
      status: req.body.status || 'Pending',
      eventDate: req.body.eventDate || new Date(),
      items: normalizeOrderItems(req.body.items || req.body.menuItems || []),
      qualityCheck: req.body.qualityCheck || undefined
    });

    await order.save();

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update catering order
const updateCateringOrder = async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      serviceType: 'catering',
      category: 'order'
    };

    if (req.user.role === 'vendor') {
      query.vendorId = getUserId(req);
    }

    const order = await Service.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update quality check for a catering order
const updateQualityCheck = async (req, res) => {
  try {
    const { appearance, taste, temperature, plating, notes } = req.body;

    const query = {
      _id: req.params.id,
      serviceType: 'catering',
      category: 'order'
    };

    // Vendor can only update their own orders
    if (req.user.role === 'vendor') {
      query.vendorId = getUserId(req);
    }

    const order = await Service.findOneAndUpdate(
      query,
      {
        $set: {
          qualityCheck: {
            appearance,
            taste,
            temperature,
            plating,
            notes,
            updatedAt: new Date(),
            updatedBy: getUserId(req)
          },
          status: req.body.status || 'Inspected'
        }
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Catering order not found or you do not have permission to update it.'
      });
    }

    res.json({
      success: true,
      message: 'Quality check saved successfully',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get the current user's saved menu draft
const getMenuDraft = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const bookingId = req.query.bookingId || null;
    const query = {
      userId: getUserId(req),
      bookingId
    };

    const draft = await MenuDraft.findOne(query).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: draft || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save the current user's menu draft
const saveMenuDraft = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userId = getUserId(req);
    const bookingId = req.body.bookingId || null;
    const items = normalizeDraftItems(req.body.items || req.body.menuItems || []);
    const guestCount = req.body.guestCount ?? null;
    const totalPrice = Number(
      req.body.totalPrice ?? items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0)
    );

    const draft = await MenuDraft.findOneAndUpdate(
      { userId, bookingId },
      {
        userId,
        bookingId,
        guestCount,
        items,
        totalPrice,
        status: 'saved'
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({
      success: true,
      message: 'Menu draft saved successfully',
      data: draft
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCateringMenu,
  createCateringMenuItem,
  updateCateringMenuItem,
  deleteCateringMenuItem,
  getCateringOrders,
  createCateringOrder,
  updateCateringOrder,
  updateQualityCheck,
  getMenuDraft,
  saveMenuDraft
};
