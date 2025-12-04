// backend/client-service/routes/clientRoutes.js

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');

// Public or protected, your choice:
router.get('/events', clientController.getEvents);

// Purchase must be protected
router.post('/purchase', authMiddleware, clientController.purchaseTicket);

// Optional: view purchases
router.get('/purchases', authMiddleware, clientController.getMyPurchases);

module.exports = router;


