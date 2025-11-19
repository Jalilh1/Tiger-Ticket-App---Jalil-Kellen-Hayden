/**
 * Integration tests for LLM Service HTTP API.
 * Focus: /api/llm/parse using keyword fallback parser (no HF API key needed).
 */

const express = require('express');
const request = require('supertest');
const cors = require('cors');

const llmRoutes = require('../routes/llmRoutes');
const initializeDatabase = require('../../admin-service/setup');

function buildApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/llm', llmRoutes);
    return app;
}

beforeAll(async () => {
    await initializeDatabase();
});

describe('LLM API integration', () => {
    let app;

    beforeEach(() => {
        app = buildApp();
    });

    test('POST /api/llm/parse returns book intent for booking phrase', async () => {
        const res = await request(app)
            .post('/api/llm/parse')
            .send({ message: 'Book 2 tickets for the campus concert' })
            .expect(200);

        expect(res.body.intent).toBe('book');
        expect(res.body.quantity).toBe(2);
        expect(res.body.event_name).toBe('Campus Concert');
    });

    test('GET /api/llm/events returns available events', async () => {
        const res = await request(app).get('/api/llm/events').expect(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});