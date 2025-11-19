/**
 * Integration tests for Client Service HTTP API.
 * Focus: event retrieval + purchase flow against SQLite.
 */

const express = require('express');
const request = require('supertest');
const cors = require('cors');

const clientRoutes = require('../routes/clientRoutes');
const initializeDatabase = require('../../admin-service/setup');

// Mock auth middleware to bypass JWT in this test suite.
// We test real JWT separately in auth-service tests.
jest.mock('../middleware/authMiddleware', () => (req, _res, next) => {
    // pretend user is authenticated with id=1
    req.userId = 1;
    next();
});

function buildApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/client', clientRoutes);
    return app;
}

beforeAll(async () => {
    await initializeDatabase();
});

describe('Client API integration', () => {
    let app;

    beforeEach(() => {
        app = buildApp();
    });

    test('GET /api/client/events returns public events', async () => {
        const res = await request(app).get('/api/client/events').expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('POST /api/client/purchase creates a purchase for an event', async () => {
        // Use event 2 from init.sql: Campus Concert
        const payload = {
            event_id: 2,
            customer_name: 'Test User',
            customer_email: 'test@example.com',
            quantity: 1
        };

        const res = await request(app)
            .post('/api/client/purchase')
            .send(payload)
            .expect(201);

        expect(res.body).toEqual(expect.objectContaining({
            event_id: payload.event_id,
            quantity: payload.quantity
        }));
    });
});