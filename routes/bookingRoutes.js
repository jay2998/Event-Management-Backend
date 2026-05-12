const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes - none for bookings (need auth)

// Stats route (protected)
router.get('/stats', authenticate, bookingController.getStats);

// Protected routes
router.get('/', authenticate, bookingController.getBookings);
router.get('/:id', authenticate, bookingController.getBooking);
router.get('/:id/menu', authenticate, bookingController.getBookingMenu);
router.get('/:id/invoice', authenticate, bookingController.getBookingInvoice);

// Validation middleware to ensure items array is present and not empty

const validateBookingItems = (req, res, next) => {
  if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Booking items are required and must contain at least one selection.' 
    });
  }
  next();
};

router.post('/', authenticate, validateBookingItems, bookingController.createBooking);
router.put('/:id', authenticate, validateBookingItems, bookingController.updateBooking);
router.put('/:id/menu', authenticate, bookingController.updateBookingMenu);
router.delete('/:id', authenticate, bookingController.cancelBooking);

// Admin/vendor only routes
router.patch('/:id/status', authenticate, authorize('vendor', 'admin'), bookingController.updateStatus);

// Payments (admin/vendor; customer via gateway callback)
router.post('/:id/payments', authenticate, bookingController.addPayment);

module.exports = router;
