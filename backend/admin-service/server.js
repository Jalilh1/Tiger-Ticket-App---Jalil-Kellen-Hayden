/**
 * Admin service bootstrap
 * Brief: Express app wiring, CORS/JSON middleware, routes, DB initialization.
 * Side effects: Starts HTTP server; initializes SQLite schema before listen.
 * // WHY: Initialize DB before accepting traffic to avoid first-request race conditions.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/adminRoutes');
const initializeDatabase = require('./setup');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/api/admin', routes);

// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'Admin Service is running',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            events: 'GET /api/admin/events',
            createEvent: 'POST /api/admin/events',
            updateEvent: 'PUT /api/admin/events/:id',
            deleteEvent: 'DELETE /api/admin/events/:id'
        }
    });
});

// Health check for monitoring
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', service: 'admin' });
});

// Initialize database before starting server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Admin Service running at http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API available at http://localhost:${PORT}/api/admin/events`); 
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
