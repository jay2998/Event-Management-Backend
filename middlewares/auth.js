const jwt = require('jsonwebtoken');
const User = require('../models/User');


// Verify JWT token and add user to req.user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-12345');

    // Support multiple possible JWT payload shapes
    const userId =
      decoded?.userId ||
      decoded?.user?.id ||
      decoded?.user?.userId ||
      decoded?.id ||
      decoded?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload (missing user id).'
      });
    }

    // Find user by ID from decoded token
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }
    
    // Store user info in a format matching login response
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };
    next();
  } catch (error) {
    // Log the actual error to the server console for debugging
    console.error('Authentication Middleware Error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired.' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during authentication.' 
    });
  }
};

// Authorize based on roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Please authenticate first.' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. This action requires ${roles.join(' or ')} role.` 
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
