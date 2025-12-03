/**
 * File: server.js
 * Brief: Express bootstrap for LLM service; mounts /api/llm routes and health root.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const llmRoutes = require('./routes/llmRoutes');

const app = express();
const PORT = process.env.PORT || 5003;

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
app.use('/api/llm', llmRoutes);

// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'LLM Service is running',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            parse: 'POST /api/llm/parse',
            events: 'GET /api/llm/events',
            confirm_booking: 'POST /api/llm/confirm_booking (requires JWT)'
        }
    });
});

// Health check for monitoring
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', service: 'llm' });
});

app.listen(PORT, () => {
    console.log(`LLM Service running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});