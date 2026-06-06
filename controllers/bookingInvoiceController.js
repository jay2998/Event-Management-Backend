const { Booking, BookingItem, BookingMenuItem, PaymentHistory, Service, User } = require('../models');

const getBookingInvoice = async (req, res) => {
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

    const invoice = {
      bookingId: booking.id,
      customer: { name: booking.customerName, email: booking.customerEmail, phone: booking.customerPhone },
      event: { name: booking.eventName, date: booking.eventDate, time: booking.eventTime, guestCount: booking.guestCount },
      venue: booking.hallService || null, package: booking.package, notes: booking.notes, status: booking.status,
      totals: { taxAmount: booking.taxAmount, discountAmount: booking.discountAmount, totalAmount: booking.totalAmount },
      payment: { paymentStatus: booking.paymentStatus, advancePaid: booking.advancePaid, payments: booking.paymentHistory || [] },
      menuItems: booking.menuItems || [],
    };

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBookingInvoice };
