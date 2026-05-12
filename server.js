const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');
const User = require('./models/User');
const path = require('path');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/halls', require('./routes/hallRoutes'));
app.use('/api/rentals', require('./routes/rentalRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/catering', require('./routes/cateringRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
