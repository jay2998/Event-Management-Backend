const express = require('express');
const router = express.Router();
const hallController = require('../controllers/hallController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', hallController.getHalls);
router.get('/:id', hallController.getHall);

// Protected routes
// Admin can modify any hall.
// Vendor can only modify their own halls (vendorId === req.user.id).
const assertOwnershipOrAdmin = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

    // Ownership check: must match the hall's vendorId
    const Hall = require('../models/Hall');
    const hall = await Hall.findById(req.params.id).select('vendorId');
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }
    if (hall.vendorId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. Not your hall.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.post('/', authenticate, authorize('vendor', 'admin'), hallController.createHall);
router.put('/:id', authenticate, authorize('vendor', 'admin'), assertOwnershipOrAdmin, hallController.updateHall);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), assertOwnershipOrAdmin, hallController.deleteHall);

// Vendor routes

router.get('/vendor/my-halls', authenticate, authorize('vendor', 'admin'), hallController.getVendorHalls);

module.exports = router;
