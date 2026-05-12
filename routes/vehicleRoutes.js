const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/vehicles/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

// Filter for JPEG/PNG
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Public routes
router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicle);

// Protected routes (vendor/admin only)
router.post('/', authenticate, authorize('vendor', 'admin'), upload.array('images', 5), vehicleController.createVehicle);
router.put('/:id', authenticate, authorize('vendor', 'admin'), upload.array('images', 5), vehicleController.updateVehicle);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), vehicleController.deleteVehicle);
router.patch('/:id/availability', authenticate, authorize('vendor', 'admin'), vehicleController.updateAvailability);
router.patch('/:id/condition', authenticate, authorize('vendor', 'admin'), vehicleController.updateCondition);

module.exports = router;
