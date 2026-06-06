const { Booking, BookingItem, BookingMenuItem, PaymentHistory, Service, User, Availability } = require('../models');
const { checkAvailability } = require('../bookingHelper');
const { Op } = require('sequelize');

const bookingIncludes = [
  { model: User, as: 'customer', attributes: ['name', 'email'] },
  { model: Service, as: 'hallService', attributes: ['name', 'category', 'basePrice', 'city'] },
  {
    model: BookingItem, as: 'items',
    include: [{ model: Service, as: 'service', attributes: ['name', 'category', 'basePrice', 'vendorId'] }],
  },
  { model: BookingMenuItem, as: 'menuItems' },
  { model: PaymentHistory, as: 'paymentHistory' },
];

exports.createBooking = async (req, res) => {
  try {
    const {
      items = [], customerId, eventName, eventDate, eventTime, customerName,
      customerEmail, customerPhone, hall, guestCount, package: bookingPackage,
      notes, taxAmount = 0, discountAmount = 0, status = 'pending',
    } = req.body;

    const resolvedCustomerId = customerId || req.user?.id;

    for (const item of items) {
      const isAvailable = await checkAvailability(item.serviceId, item.slotDate, item.slotStartTime, item.slotEndTime);
      if (!isAvailable) throw new Error(`Service ${item.serviceId} is already booked for this slot.`);
    }

    const totalAmountBeforeAdjustments = items.reduce(
      (sum, item) => sum + Number(item.priceAtBooking || 0) * Number(item.quantity || 1), 0);
    const computedTax = Number(taxAmount || 0);
    const computedDiscount = Number(discountAmount || 0);
    const totalAmount = Math.max(0, totalAmountBeforeAdjustments + computedTax - computedDiscount);
    const bookingHall = hall || items[0]?.serviceId || null;

    const newBooking = await Booking.create({
      customerId: resolvedCustomerId, eventName, eventDate, eventTime, startTime: eventTime, endTime: eventTime,
      customerName, customerEmail, customerPhone, hall: bookingHall, guestCount, package: bookingPackage,
      notes, taxAmount: computedTax, discountAmount: computedDiscount, totalAmount, status,
    });

    if (items.length > 0) {
      await BookingItem.bulkCreate(
        items.map(item => ({ ...item, bookingId: newBooking.id }))
      );
    }

    const booking = await Booking.findByPk(newBooking.id, { include: bookingIncludes });
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    let filter = {};
    if (req.user.role === 'customer') filter.customerId = req.user.id;
    else if (req.user.role === 'vendor') {
      const vendorServices = await Service.findAll({ where: { vendorId: req.user.id }, attributes: ['id'] });
      const serviceIds = vendorServices.map(s => s.id);
      const bookingIds = await BookingItem.findAll({
        where: { serviceId: { [Op.in]: serviceIds } },
        attributes: ['bookingId'],
      });
      filter.id = { [Op.in]: [...new Set(bookingIds.map(b => b.bookingId))] };
    }

    const bookings = await Booking.findAll({
      where: filter,
      include: bookingIncludes,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, { include: bookingIncludes });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.eventTime && !updateData.startTime) updateData.startTime = updateData.eventTime;
    if (updateData.eventTime && !updateData.endTime) updateData.endTime = updateData.eventTime;

    if (Array.isArray(updateData.items)) {
      const totalBeforeAdj = updateData.items.reduce(
        (sum, item) => sum + Number(item.priceAtBooking || 0) * Number(item.quantity || 1), 0);
      const t = Number(updateData.taxAmount || 0);
      const d = Number(updateData.discountAmount || 0);
      updateData.totalAmount = Math.max(0, totalBeforeAdj + t - d);
    }

    if (!updateData.hall && Array.isArray(updateData.items) && updateData.items[0]?.serviceId) {
      updateData.hall = updateData.items[0].serviceId;
    }

    const [updated] = await Booking.update(updateData, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (Array.isArray(updateData.items)) {
      await BookingItem.destroy({ where: { bookingId: req.params.id } });
      await BookingItem.bulkCreate(updateData.items.map(item => ({ ...item, bookingId: req.params.id })));
    }

    const booking = await Booking.findByPk(req.params.id, { include: bookingIncludes });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const [updated] = await Booking.update({ status: 'cancelled' }, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ success: false, message: 'Booking not found' });
    const booking = await Booking.findByPk(req.params.id);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const [updated] = await Booking.update({ status }, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ success: false, message: 'Booking not found' });
    const booking = await Booking.findByPk(req.params.id);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await Booking.count();
    const pending = await Booking.count({ where: { status: 'pending' } });
    const confirmed = await Booking.count({ where: { status: 'confirmed' } });
    const completed = await Booking.count({ where: { status: 'completed' } });

    const revenueResult = await Booking.sum('totalAmount', { where: { isDeleted: false } });
    const totalRevenue = revenueResult || 0;

    res.json({
      success: true,
      data: { total, pending, confirmed, completed, totalBookings: total, totalRevenue },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await PaymentHistory.create({
      bookingId: parseInt(req.params.id),
      transactionId: req.body.transactionId || `txn-${Date.now()}`,
      amount: Number(req.body.amount || 0),
      paidAt: req.body.paidAt ? new Date(req.body.paidAt) : new Date(),
      paymentMethod: req.body.paymentMethod || 'cash',
    });

    const payments = await PaymentHistory.findAll({ where: { bookingId: req.params.id } });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    let paymentStatus = 'unpaid';
    if (totalPaid > 0 && totalPaid < Number(booking.totalAmount)) paymentStatus = 'partial';
    else if (totalPaid >= Number(booking.totalAmount)) paymentStatus = 'paid';

    await Booking.update({ advancePaid: totalPaid, paymentStatus }, { where: { id: req.params.id } });

    const updated = await Booking.findByPk(req.params.id, { include: bookingIncludes });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getBookingMenu = async (req, res) => {
  try {
    const items = await BookingMenuItem.findAll({ where: { bookingId: req.params.id } });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBookingMenu = async (req, res) => {
  try {
    const { menuItems = [] } = req.body;
    await BookingMenuItem.destroy({ where: { bookingId: req.params.id } });
    if (menuItems.length > 0) {
      await BookingMenuItem.bulkCreate(menuItems.map(item => ({ ...item, bookingId: req.params.id })));
    }
    const items = await BookingMenuItem.findAll({ where: { bookingId: req.params.id } });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getBookingInvoice = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Service, as: 'hallService', attributes: ['name', 'category', 'basePrice', 'city'] },
        {
          model: BookingItem, as: 'items',
          include: [{
            model: Service, as: 'service',
            attributes: ['name', 'category', 'basePrice', 'vendorId'],
            include: [{ model: User, as: 'vendor', attributes: ['name', 'email'] }],
          }],
        },
        { model: BookingMenuItem, as: 'menuItems' },
        { model: PaymentHistory, as: 'paymentHistory' },
      ],
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (req.user?.role === 'customer' && String(booking.customerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.user?.role === 'vendor') {
      const vendorId = String(req.user.id);
      const hasVendorItem = (booking.items || []).some(it => it.service?.vendorId === vendorId);
      if (!hasVendorItem) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const payments = booking.paymentHistory || [];
    const invoice = {
      bookingId: booking.id,
      customer: { name: booking.customerName, email: booking.customerEmail, phone: booking.customerPhone },
      event: { name: booking.eventName, date: booking.eventDate, time: booking.eventTime, guestCount: booking.guestCount },
      venue: booking.hallService || null,
      package: booking.package, notes: booking.notes, status: booking.status,
      totals: { taxAmount: booking.taxAmount, discountAmount: booking.discountAmount, totalAmount: booking.totalAmount },
      payment: { paymentStatus: booking.paymentStatus, advancePaid: booking.advancePaid, payments },
      menuItems: booking.menuItems || [],
    };

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
