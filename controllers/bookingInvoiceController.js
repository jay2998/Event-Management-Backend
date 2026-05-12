const Booking = require('../models/Booking');

/**
 * Booking invoice payload.
 */
const getBookingInvoice = async (req, res) => {
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

module.exports = { getBookingInvoice };

