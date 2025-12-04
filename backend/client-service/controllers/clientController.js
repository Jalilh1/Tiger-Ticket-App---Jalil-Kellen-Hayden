// client-service/controllers/clientController.js
const clientModel = require('../models/clientModel');

const clientController = {
  listEvents: async (_req, res) => {
    try {
      const events = await clientModel.getAllEvents();
      res.json(events);
    } catch (err) {
      console.error('List events error:', err);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  },

  getEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const event = await clientModel.getEventById(id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (err) {
      console.error('Get event error:', err);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  },

  purchaseTicket: async (req, res) => {
    try {
      const { event_id, quantity } = req.body;
      const user_id = req.user.id; // from authMiddleware

      if (!event_id || !quantity) {
        return res.status(400).json({
          error: 'Missing required fields: event_id, quantity'
        });
      }

      const purchase = await clientModel.purchaseTicket({
        event_id,
        user_id,
        quantity
      });

      res.status(201).json(purchase);
    } catch (err) {
      console.error('Purchase ticket error:', err);
      if (err.message === 'Event not found' || err.message === 'Not enough tickets available') {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Failed to purchase ticket' });
    }
  }
};

module.exports = clientController;