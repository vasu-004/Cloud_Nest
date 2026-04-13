// middleware/auth.js - JWT authentication middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request object (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || '').trim().toLowerCase();
    const allowedRoles = roles.map(r => r.trim().toLowerCase());
    
    if (!allowedRoles.includes(userRole)) {
      console.warn(`[Auth] Blocked ${req.user?.email} (${userRole}) from accessing route. Required: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `User role '${userRole}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
