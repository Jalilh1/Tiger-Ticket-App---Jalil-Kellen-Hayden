/**
 * Integration tests for Admin Service HTTP API.
 * Focus: event creation + retrieval against real SQLite DB.
 */

const express = require('express');
const request = require('supertest');
const cors = require('cors');
const path = require('path');

const adminRoutes = require('../routes/adminRoutes');
const initializeDatabase = require('../setup');

function buildApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    // In server.js, these are mounted at `/api/admin`
    app.use('/api/admin', adminRoutes);
    return app;
}

beforeAll(async () => {
    // Ensure schema + seed events are present
    await initializeDatabase();
});

describe('Admin API integration', () => {
    let app;

    beforeEach(() => {
        app = buildApp();
    });

    test('GET /api/admin/events returns seeded events', async () => {
        const res = await request(app).get('/api/admin/events').expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        // Seeded in shared-db/init.sql
        const names = res.body.map(e => e.name);
        expect(names).toEqual(expect.arrayContaining([
            'Clemson Football Game',
            'Campus Concert',
            'Career Fair'
        ]));
    });

    test('POST /api/admin/events creates a new event', async () => {
        const payload = {
            name: 'Tiger Hackathon',
            date: '2025-11-30',
            capacity: 300,
            available_tickets: 300
        };

        const createRes = await request(app)
            .post('/api/admin/events')
            .send(payload)
            .expect(201);

        expect(createRes.body.id).toBeDefined();
        expect(createRes.body.name).toBe(payload.name);

        const getRes = await request(app)
            .get(`/api/admin/events/${createRes.body.id}`)
            .expect(200);

        expect(getRes.body.name).toBe(payload.name);
        expect(getRes.body.capacity).toBe(payload.capacity);
    });
});