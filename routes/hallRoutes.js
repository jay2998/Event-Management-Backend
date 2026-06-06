const express = require('express');
const router = express.Router();
const hallController = require('../controllers/hallController');
const { authenticate, authorize } = require('../middlewares/auth');
const { Service } = require('../models');

const assertOwnershipOrAdmin = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();
    const hall = await Service.findOne({ where: { id: req.params.id, serviceType: 'hall' }, attributes: ['vendorId'] });
    if (!hall) return res.status(404).json({ success: false, message: 'Hall not found' });
    if (String(hall.vendorId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied. Not your hall.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.get('/vendor/my-halls', authenticate, authorize('vendor', 'admin'), hallController.getVendorHalls);
router.get('/', hallController.getHalls);
router.get('/:id', hallController.getHall);
router.post('/', authenticate, authorize('vendor', 'admin'), hallController.createHall);
router.put('/:id', authenticate, authorize('vendor', 'admin'), assertOwnershipOrAdmin, hallController.updateHall);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), assertOwnershipOrAdmin, hallController.deleteHall);

module.exports = router;
