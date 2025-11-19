/**
 * LLM Routes
 * Brief: Routes for LLM-related endpoints.
 */
const express = require('express');
const router = express.Router();
const llmController = require('../controllers/llmController');
const authMiddleware = require('../middleware/authMiddleware');
// POST /api/llm/parse
// Body: { message: string }
router.post('/parse', llmController.parseBooking);

// GET /api/llm/events
router.get('/events', llmController.getAvailableEvents);

// POST /api/llm/confirm_booking
// Body: { event_id: number, customer_name: string, customer_email: string, quantity: number }
router.post('/confirm_booking', authMiddleware, llmController.confirmBooking);

module.exports = router;