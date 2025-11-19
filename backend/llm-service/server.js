/**
 * File: server.js
 * Brief: Express bootstrap for LLM service; mounts /api/llm routes and health root.
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const llmRoutes = require('./routes/llmRoutes');

const app = express();
const PORT=5003;

app.use(cors());
app.use(express.json());  

app.use('/api/llm', llmRoutes);

app.get('/', (_req, res) => {
    res.json({
        message: 'LLM Service is running',
        endpoints: {
            parse: ' POST /api/llm/parse',
            events: ' GET /api/llm/events',
            confirm_booking: ' POST /api/llm/confirm_booking'
        }
    });
});

app.listen(PORT, () => {
    console.log(`LLM Service running at http://localhost:${PORT}`);
});