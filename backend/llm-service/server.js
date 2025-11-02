const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../../.env' });

const llmRoutes = require('./routes/llmRoutes');

const app = express();
const PORT = process.env.PORT || 5002;

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