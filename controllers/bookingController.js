const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { checkAvailability } = require('../bookingHelper');

exports.createBooking = async (req, res) => {
  // 1. Start a Mongoose Session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      items = [],
      customerId,
      eventName,
      eventDate,
      eventTime,
      customerName,
      customerEmail,
      customerPhone,
      hall,
      guestCount,
      package: bookingPackage,
      notes,
      taxAmount = 0,
      discountAmount = 0,
      status = 'pending'
    } = req.body;

    const resolvedCustomerId = customerId || req.user?.id;

    // 2. Perform availability checks within the transaction
    for (const item of items) {
      const isAvailable = await checkAvailability(
        item.serviceId,
        item.slotDate,
        item.slotStartTime,
        item.slotEndTime,
        session
      );

      if (!isAvailable) {
        throw new Error(`Service ${item.serviceId} is already booked for this slot.`);
      }
    }

    const totalAmountBeforeAdjustments = items.reduce(
      (sum, item) => sum + Number(item.priceAtBooking || 0) * Number(item.quantity || 1),
      0
    );
    const computedTax = Number(taxAmount || 0);
    const computedDiscount = Number(discountAmount || 0);
    const totalAmount = Math.max(0, totalAmountBeforeAdjustments + computedTax - computedDiscount);
    const bookingHall = hall || items[0]?.serviceId || null;

    // 3. Create the booking record
    const newBooking = new Booking({
      customerId: resolvedCustomerId,
      eventName,
      eventDate,
      eventTime,
      startTime: eventTime,
      endTime: eventTime,
      customerName,
      customerEmail,
      customerPhone,
      hall: bookingHall,
      guestCount,
      package: bookingPackage,
      notes,
      items,
      taxAmount: computedTax,
      discountAmount: computedDiscount,
      totalAmount,
      status
    });

    await newBooking.save({ session });

    // 4. Commit the transaction
    await session.commitTransaction();
    res.status(201).json({ success: true, data: newBooking });

  } catch (error) {
    // 5. If anything fails, abort the transaction to prevent partial data
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    // 6. End the session
    session.endSession();
  }
};

/**
 * Get all bookings with role-based filtering.
 */
exports.getBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let filter = {};

    if (req.user.role === 'customer') {
      filter = { customerId: req.user.id };
    } else if (req.user.role === 'vendor') {
      // Strict Multi-Tenancy: Find all services owned by this vendor
      const vendorServices = await Service.find({ vendorId: req.user.id }).select('_id');
      const serviceIds = vendorServices.map(s => s._id);
      
      // Filter bookings that contain any of these services
      filter = { 'items.serviceId': { $in: serviceIds } };
    }

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email')
      .populate('hall', 'name category basePrice city')
      .populate({
        path: 'items.serviceId',
        select: 'name category basePrice vendorId',
        populate: { path: 'vendorId', select: 'name email' }
      })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single booking by ID.
 */
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('hall', 'name category basePrice city')
      .populate({
        path: 'items.serviceId',
        select: 'name category basePrice vendorId',
        populate: { path: 'vendorId', select: 'name email' }
      });
      
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update booking details.
 */
exports.updateBooking = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.eventTime && !updateData.startTime) {
      updateData.startTime = updateData.eventTime;
    }

    if (updateData.eventTime && !updateData.endTime) {
      updateData.endTime = updateData.eventTime;
    }

    if (Array.isArray(updateData.items)) {
      const totalAmountBeforeAdjustments = updateData.items.reduce(
        (sum, item) => sum + Number(item.priceAtBooking || 0) * Number(item.quantity || 1),
        0
      );
      const computedTax = Number(updateData.taxAmount || 0);
      const computedDiscount = Number(updateData.discountAmount || 0);
      updateData.totalAmount = Math.max(0, totalAmountBeforeAdjustments + computedTax - computedDiscount);
    }

    if (!updateData.hall && Array.isArray(updateData.items) && updateData.items[0]?.serviceId) {
      updateData.hall = updateData.items[0].serviceId;
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Cancel a booking (Soft Update).
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Update booking status (Admin/Vendor only).
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get booking statistics.
 */
exports.getStats = async (req, res) => {
  try {
    const total = await Booking.countDocuments();
    const pending = await Booking.countDocuments({ status: 'pending' });
    const confirmed = await Booking.countDocuments({ status: 'confirmed' });
    const completed = await Booking.countDocuments({ status: 'completed' });
    const revenueAgg = await Booking.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$totalAmount', 0] } }
        }
      }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    res.json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        completed,
        totalBookings: total,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        completedBookings: completed,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add a payment record to a booking.
 */
exports.addPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    booking.paymentHistory.push({
      transactionId: req.body.transactionId || `txn-${Date.now()}`,
      amount: Number(req.body.amount || 0),
      paidAt: req.body.paidAt ? new Date(req.body.paidAt) : new Date(),
      paymentMethod: req.body.paymentMethod || 'cash'
    });
    await booking.save();
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get menu selections for a booking.
 */
exports.getBookingMenu = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).select('menuItems customerId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, data: booking.menuItems || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update menu selections for a booking.
 */
exports.updateBookingMenu = async (req, res) => {
  try {

    const { menuItems = [] } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { menuItems },
      { new: true, runValidators: true }
    );

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, data: booking.menuItems || [] });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Booking invoice payload.
 */
exports.getBookingInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hall', 'name category basePrice city')
      .populate({
        path: 'items.serviceId',
        select: 'name category basePrice vendorId',
        populate: { path: 'vendorId', select: 'name email' }
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // customer can only see own bookings
    if (req.user?.role === 'customer' && booking.customerId?.toString() !== req.user.id?.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // vendor can see bookings only if at least one item belongs to their services
    if (req.user?.role === 'vendor') {
      const vendorId = req.user.id?.toString();
      const hasVendorItem = (booking.items || []).some(it => it.serviceId?.vendorId?.toString() === vendorId);
      if (!hasVendorItem) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const payments = booking.paymentHistory || [];
    const invoice = {
      bookingId: booking._id,
      customer: {
        name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone
      },
      event: {
        name: booking.eventName,
        date: booking.eventDate,
        time: booking.eventTime,
        guestCount: booking.guestCount
      },
      venue: booking.hall || null,
      package: booking.package,
      notes: booking.notes,
      status: booking.status,
      totals: {
        taxAmount: booking.taxAmount,
        discountAmount: booking.discountAmount,
        totalAmount: booking.totalAmount
      },
      payment: {
        paymentStatus: booking.paymentStatus,
        advancePaid: booking.advancePaid,
        payments
      },
      menuItems: booking.menuItems || []
    };

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

