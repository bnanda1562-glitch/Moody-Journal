const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Read token from Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mood_journal_ai_jwt_secret_token_2026_key');

    // Attach user to req
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No user found with this id' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route`
      });
    }
    next();
  };
};
