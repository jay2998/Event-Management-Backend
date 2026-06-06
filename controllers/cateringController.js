const { Service, MenuDraft, MenuDraftItem, User } = require('../models');
const { Op } = require('sequelize');

const MENU_CATEGORIES = ['appetizers', 'mains', 'desserts', 'beverages'];
const CATEGORY_ALIASES = {
  appetizer: 'appetizers', appetizers: 'appetizers', main: 'mains', mains: 'mains',
  dessert: 'desserts', desserts: 'desserts', beverage: 'beverages', beverages: 'beverages', order: 'order',
};

const normalizeCategory = (value) => {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  return CATEGORY_ALIASES[normalized] || normalized;
};

const getUserId = (req) => req.user?.id;

const normalizeDraftItems = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    name: item.name,
    price: Number(item.price || 0),
    quantity: Math.max(1, Number(item.quantity || 1)),
    category: item.category || 'appetizers',
    description: item.description || '',
  }));
};

const menuFilter = (req) => {
  const filter = { serviceType: 'catering', category: { [Op.in]: MENU_CATEGORIES } };
  if (req.user?.role === 'vendor') filter.vendorId = getUserId(req);
  return filter;
};

const orderFilter = (req) => {
  const filter = { serviceType: 'catering', category: 'order' };
  if (req.user?.role === 'vendor') filter.vendorId = getUserId(req);
  return filter;
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
    amenities: Array.isArray(body.amenities) ? body.amenities : body.amenities || [],
  };
};

const getCateringMenu = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: menuFilter(req),
      include: [{ model: User, as: 'vendor', attributes: ['name', 'email', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: services.map((s) => ({ ...s.toJSON(), category: normalizeCategory(s.category) })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCateringMenuItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    const payload = buildMenuPayload(req.body, userId);
    const item = await Service.create(payload);
    res.status(201).json({ success: true, data: { ...item.toJSON(), category: normalizeCategory(item.category) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCateringMenuItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    const where = { id: req.params.id, serviceType: 'catering', category: { [Op.in]: MENU_CATEGORIES } };
    if (req.user?.role === 'vendor') where.vendorId = userId;

    const updateData = buildMenuPayload(req.body, userId);
    const [updated] = await Service.update(updateData, { where });

    if (!updated) return res.status(404).json({ success: false, message: 'Menu item not found' });

    const item = await Service.findByPk(req.params.id);
    res.json({ success: true, data: { ...item.toJSON(), category: normalizeCategory(item.category) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCateringMenuItem = async (req, res) => {
  try {
    const where = { id: req.params.id, serviceType: 'catering', category: { [Op.in]: MENU_CATEGORIES } };
    if (req.user?.role === 'vendor') where.vendorId = getUserId(req);

    const item = await Service.findOne({ where });
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });

    await item.softDelete();
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCateringOrders = async (req, res) => {
  try {
    const orders = await Service.findAll({
      where: orderFilter(req),
      include: [{ model: User, as: 'vendor', attributes: ['name', 'email', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCateringOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const order = await Service.create({
      ...req.body,
      name: req.body.name || req.body.eventName || 'Catering Order',
      serviceType: 'catering',
      category: 'order',
      vendorId: userId,
      city: req.body.city || 'Other',
      status: req.body.status || 'Pending',
      eventDate: req.body.eventDate || new Date(),
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCateringOrder = async (req, res) => {
  try {
    const where = { id: req.params.id, serviceType: 'catering', category: 'order' };
    if (req.user.role === 'vendor') where.vendorId = getUserId(req);

    const [updated] = await Service.update(req.body, { where });
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found' });

    const order = await Service.findByPk(req.params.id);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateQualityCheck = async (req, res) => {
  try {
    const { appearance, taste, temperature, plating, notes } = req.body;
    const where = { id: req.params.id, serviceType: 'catering', category: 'order' };
    if (req.user.role === 'vendor') where.vendorId = getUserId(req);

    const [updated] = await Service.update(
      {
        qualityCheck: JSON.stringify({
          appearance, taste, temperature, plating, notes,
          updatedAt: new Date(),
          updatedBy: getUserId(req),
        }),
        status: req.body.status || 'Inspected',
      },
      { where }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Catering order not found or no permission.' });

    const order = await Service.findByPk(req.params.id);
    res.json({ success: true, message: 'Quality check saved successfully', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMenuDraft = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const bookingId = req.query.bookingId || null;
    const where = { userId: getUserId(req) };
    if (bookingId) where.bookingId = bookingId;

    const draft = await MenuDraft.findOne({
      where,
      include: [{ model: MenuDraftItem, as: 'items' }],
      order: [['updatedAt', 'DESC']],
    });

    res.json({ success: true, data: draft || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const saveMenuDraft = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const userId = getUserId(req);
    const bookingId = req.body.bookingId || null;
    const items = normalizeDraftItems(req.body.items || req.body.menuItems || []);
    const guestCount = req.body.guestCount ?? null;
    const totalPrice = Number(
      req.body.totalPrice ?? items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0)
    );

    const [draft, created] = await MenuDraft.upsert({
      userId,
      bookingId,
      guestCount,
      totalPrice,
      status: 'saved',
    });

    if (items.length > 0) {
      await MenuDraftItem.destroy({ where: { menuDraftId: draft.id } });
      await MenuDraftItem.bulkCreate(
        items.map(item => ({ ...item, menuDraftId: draft.id }))
      );
    }

    res.json({ success: true, message: 'Menu draft saved successfully', data: draft });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCateringMenu, createCateringMenuItem, updateCateringMenuItem, deleteCateringMenuItem,
  getCateringOrders, createCateringOrder, updateCateringOrder, updateQualityCheck,
  getMenuDraft, saveMenuDraft,
};
