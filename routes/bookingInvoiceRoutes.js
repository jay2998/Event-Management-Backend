const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/auth');
const bookingInvoiceController = require('../controllers/bookingInvoiceController');

// Invoice data for a booking
router.get('/:id', authenticate, bookingInvoiceController.getBookingInvoice);

module.exports = router;


