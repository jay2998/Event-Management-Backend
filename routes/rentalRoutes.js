const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', rentalController.getRentals);
router.get('/:id', rentalController.getRental);

// Protected routes
// Admin can modify any rental.
// Vendor can only modify their own rentals (vendorId === req.user.id).
const assertRentalOwnershipOrAdmin = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

    const Rental = require('../models/Rental');
    const rental = await Rental.findById(req.params.id).select('vendorId');

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental service not found' });
    }

    if (rental.vendorId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. Not your rental.' });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.post('/', authenticate, authorize('vendor', 'admin'), rentalController.createRental);
router.put('/:id', authenticate, authorize('vendor', 'admin'), assertRentalOwnershipOrAdmin, rentalController.updateRental);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), assertRentalOwnershipOrAdmin, rentalController.deleteRental);


// Vendor routes
router.get('/vendor/my-rentals', authenticate, authorize('vendor', 'admin'), rentalController.getVendorRentals);

// Rental item routes
router.post(
  '/:id/items',
  authenticate,
  authorize('vendor', 'admin'),
  assertRentalOwnershipOrAdmin,
  rentalController.addRentalItem
);
router.put(
  '/:id/items/:itemId',
  authenticate,
  authorize('vendor', 'admin'),
  assertRentalOwnershipOrAdmin,
  rentalController.updateRentalItem
);
router.delete(
  '/:id/items/:itemId',
  authenticate,
  authorize('vendor', 'admin'),
  assertRentalOwnershipOrAdmin,
  rentalController.deleteRentalItem
);


module.exports = router;
