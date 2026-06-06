const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('AUTH DEBUG: No valid Authorization header', authHeader);
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const token = authHeader.replace('Bearer ', '');
    console.log('AUTH DEBUG: Token received, length:', token.length);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-12345');
    console.log('AUTH DEBUG: Decoded payload:', JSON.stringify(decoded));

    const userId = decoded?.userId || decoded?.user?.id || decoded?.user?.userId || decoded?.id || decoded?._id;
    console.log('AUTH DEBUG: Extracted userId:', userId);

    if (!userId) {
      console.log('AUTH DEBUG: No userId in payload');
      return res.status(401).json({ success: false, message: 'Invalid token payload (missing user id).' });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    console.log('AUTH DEBUG: User found:', !!user);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
    }

    req.user = {
      id: user.id,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };
    next();
  } catch (error) {
    console.error('AUTH DEBUG: Exception:', error.message, error.name);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error during authentication.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Access denied. Please authenticate first.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. This action requires ${roles.join(' or ')} role.` });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
