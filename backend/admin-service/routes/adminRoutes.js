const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/events', adminController.listEvents);
router.get('/events/:id', adminController.getEvent);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);

module.exports = router;
