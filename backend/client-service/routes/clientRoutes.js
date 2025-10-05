const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');


router.get('/events', clientController.listEvents);
router.get('/events/:id', clientController.getEvent);
router.post('/purchase', clientController.purchaseTicket);

module.exports = router;


