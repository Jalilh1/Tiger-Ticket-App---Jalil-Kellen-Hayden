/**
 * Client routes
 * Brief: Public endpoints to browse events and purchase tickets.
 * Exposes: GET /events, GET /events/:id, POST /purchase
 */

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/events', clientController.listEvents);
router.get('/events/:id', clientController.getEvent);
router.post('/purchase', authMiddleware, clientController.purchaseTicket);

module.exports = router;


