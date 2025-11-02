const express = require('express');
const router = express.Router();
const llmController = require('../controllers/llmController');

/**
 * LLM Routes
 * Brief: Routes for LLM-related endpoints.
 */

// POST /api/llm/parse
router.post('/parse', llmController.parseBooking);

router.get('/events', llmController.getAvailableEvents);

router.post('/confirm_booking', llmController.confirmBooking);

module.exports = router;