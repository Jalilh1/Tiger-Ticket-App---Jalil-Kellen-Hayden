// backend/client-service/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// IMPORTANT: rely on Railway env var JWT_SECRET (no local .env here)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('CLIENT SERVICE auth header:', authHeader);
    console.log('JWT_SECRET in middleware:', JWT_SECRET);
    console.log('Is fallback?', JWT_SECRET === 'fallback_secret');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
        requiresAuth: true,
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token in client-service:', decoded);

    // Your token payload has `userId`, so support both shapes just in case
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      console.error('Decoded token missing userId/id:', decoded);
      return res.status(401).json({
        error: 'Invalid token payload',
        requiresAuth: true,
      });
    }

    req.user = {
      id: userId,
      email: decoded.email,
      name: decoded.name,
    };

    return next();
  } catch (error) {
    console.error('authMiddleware error in client-service:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired',
        requiresAuth: true,
        expired: true,
      });
    }

    return res.status(401).json({
      error: 'Invalid token',
      requiresAuth: true,
    });
  }
};

module.exports = authMiddleware;