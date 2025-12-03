require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5004;

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

app.use('/api/auth', require('./routes/authRoutes'));

// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'Auth Service is running',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            me: 'GET /api/auth/me (requires JWT)'
        }
    });
});

// Health check for monitoring
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', service: 'auth' });
});

app.listen(PORT, () => {
    console.log(`Auth Service running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Register: POST http://localhost:${PORT}/api/auth/register`);
    console.log(`Login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`Get Current User: GET http://localhost:${PORT}/api/auth/me`);
});

