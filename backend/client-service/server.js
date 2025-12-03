/**
 * Client service bootstrap
 * Brief: Express app wiring for client-facing API.
 * Side effects: Starts HTTP server and mounts /api/client routes.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/clientRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

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
app.use('/api/client', routes);

// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'Client Service is running',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            events: 'GET /api/client/events',
            event: 'GET /api/client/events/:id',
            purchase: 'POST /api/client/purchase (requires JWT)'
        }
    });
});

// Health check for monitoring
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', service: 'client' });
});

app.listen(PORT, () => {
    console.log(`Client Service running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API available at http://localhost:${PORT}/api/client/events`);
});