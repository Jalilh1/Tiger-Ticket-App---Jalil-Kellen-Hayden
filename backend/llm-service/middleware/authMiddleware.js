const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const authMiddleware = (req, res, next) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('CLIENT SERVICE auth header:', req.headers.authorization);
    console.log('JWT_SECRET in middleware:', JWT_SECRET);
    console.log('Is fallback?', JWT_SECRET === 'fallback_secret');
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided',
        requiresAuth: true 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        requiresAuth: true,
        expired: true
      });
    }

    return res.status(401).json({ 
      error: 'Invalid token',
      requiresAuth: true 
    });
  }
};

module.exports = authMiddleware;