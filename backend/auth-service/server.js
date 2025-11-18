const express = require('express');
const cors = require('cors');
const e = require('express');
require ('dotenv').config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));

app.get('/', (_req, res) => {
    res.json({
        message: 'Auth Service is running',
        endpoints: {
            register: ' POST /api/auth/register',
            login: ' POST /api/auth/login',
            me: ' GET /api/auth/me (requires JWT)'
        }
    });
});

app.listen(PORT, () => {
    console.log(`Auth Service running at http://localhost:${PORT}`);
    console.log('Reigster: POST http://localhost:${PORT}/api/auth/register');
    console.log('Login: POST http://localhost:${PORT}/api/auth/login');
    console.log('Get Current User: GET http://localhost:${PORT}/api/auth/me');
});

