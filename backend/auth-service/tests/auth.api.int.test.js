/**
 * Integration tests for Auth Service HTTP API.
 * Focus: registration, login, /me with real JWT.
 */

const express = require('express');
const request = require('supertest');
const cors = require('cors');

const authRoutes = require('../routes/authRoutes');
const initializeDatabase = require('../../admin-service/setup');

function buildApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    return app;
}

beforeAll(async () => {
    // Ensure shared tables exist (users/events/purchases)
    await initializeDatabase();
});

describe('Auth API integration', () => {
    let app;

    beforeEach(() => {
        app = buildApp();
    });

    test('POST /api/auth/register creates a user and POST /api/auth/login returns JWT', async () => {
        const email = `student${Date.now()}@clemson.edu`;
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                email,
                name: 'Test Student',
                password: 'Password123!'
            })
            .expect(201);

        expect(registerRes.body).toEqual(
            expect.objectContaining({
                email,
                name: 'Test Student'
            })
        );

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email, password: 'Password123!' })
            .expect(200);

        expect(loginRes.body.token).toBeDefined();
        expect(loginRes.body.user.email).toBe(email);

        const token = loginRes.body.token;

        const meRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(meRes.body.email).toBe(email);
    });

    test('GET /api/auth/me with missing token returns 401', async () => {
        const res = await request(app).get('/api/auth/me').expect(401);
        expect(res.body.requiresAuth).toBe(true);
    });
});