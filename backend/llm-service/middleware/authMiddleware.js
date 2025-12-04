// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// IMPORTANT: JWT_SECRET must be set in Railway env for EACH service
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    '[authMiddleware] JWT_SECRET is not set in environment. ' +
    'All token verification will fail until it is configured.'
  );
}

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
        requiresAuth: true,
      });
    }

    const token = authHeader.substring(7); // strip "Bearer "

    const decoded = jwt.verify(token, JWT_SECRET);

    // Normalized user object
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired',
        requiresAuth: true,
        expired: true,
      });
    }

    console.error('[authMiddleware] Token verification failed:', error);
    return res.status(401).json({
      error: 'Invalid token',
      requiresAuth: true,
    });
  }
};

module.exports = authMiddleware;