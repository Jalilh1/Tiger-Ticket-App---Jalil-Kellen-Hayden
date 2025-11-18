const authModel = require('../models/authModel');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';

const authController = {
    register: async (req, res) => {
        try {
            const { email, name, password } = req.body;

            if (!email || !name || !password) {
                return res.status(400).json({ 
                    error: 'Email, name, and password are required'
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    error: 'Invalid email format' 
                });
            }

            if (password.length < 6) {
                return res.status(400).json({ 
                    error: 'Password must be at least 6 characters long' 
                });
            }

            const user = await authModel.registerUser({ email, name, password });

            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.name },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ 
                    error: 'Email and password are required' 
                });
            }

            const user = await authModel.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({ 
                    error: 'Invalid email or password' 
                });
            }

            const isValidPassword = await authModel.verifyPassword(
                password, user.password_hash
            );

            if (!isValidPassword) {
                return res.status(401).json({ 
                    error: 'Invalid email or password' 
                });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.name },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    getCurrentUser: async (req, res) => {
        try {
            
            const user = await authModel.getUserById(req.user.id);

            if (!user) {
                return res.status(404).json({ 
                    error: 'User not found' 
                });
            }

            res.json({
                id: user.id,
                email: user.email,
                name: user.name
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ error: 'Failed to retrieve user' });
        }
    }
};

module.exports = authController;




