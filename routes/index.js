const express = require('express');
const router = express.Router();

// Import all routes
const authRoutes = require('./authRoutes');
const hallRoutes = require('./hallRoutes');
const rentalRoutes = require('./rentalRoutes');
const bookingRoutes = require('./bookingRoutes');
const cateringRoutes = require('./cateringRoutes');
const vehicleRoutes = require('./vehicleRoutes');

// Base route
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Event Management System API',
    version: '1.0.0'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/halls', hallRoutes);
router.use('/rentals', rentalRoutes);
router.use('/bookings', bookingRoutes);
router.use('/catering', cateringRoutes);
router.use('/vehicles', vehicleRoutes);

module.exports = router;
