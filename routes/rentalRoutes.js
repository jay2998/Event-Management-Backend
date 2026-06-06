const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const { authenticate, authorize } = require('../middlewares/auth');
const { Service } = require('../models');

const assertRentalOwnershipOrAdmin = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();
    const rental = await Service.findOne({ where: { id: req.params.id, serviceType: 'rental' }, attributes: ['vendorId'] });
    if (!rental) return res.status(404).json({ success: false, message: 'Rental service not found' });
    if (String(rental.vendorId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied. Not your rental.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.get('/', rentalController.getRentals);
router.get('/vendor/my-rentals', authenticate, authorize('vendor', 'admin'), rentalController.getVendorRentals);
router.get('/:id', rentalController.getRental);
router.post('/', authenticate, authorize('vendor', 'admin'), rentalController.createRental);
router.put('/:id', authenticate, authorize('vendor', 'admin'), assertRentalOwnershipOrAdmin, rentalController.updateRental);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), assertRentalOwnershipOrAdmin, rentalController.deleteRental);
router.post('/:id/items', authenticate, authorize('vendor', 'admin'), assertRentalOwnershipOrAdmin, rentalController.addRentalItem);
router.put('/:id/items/:itemId', authenticate, authorize('vendor', 'admin'), assertRentalOwnershipOrAdmin, rentalController.updateRentalItem);
router.delete('/:id/items/:itemId', authenticate, authorize('vendor', 'admin'), assertRentalOwnershipOrAdmin, rentalController.deleteRentalItem);

module.exports = router;
