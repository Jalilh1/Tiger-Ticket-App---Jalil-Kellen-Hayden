const clientModel = require('../models/clientModel');

const clientController = {
  listEvents: async (req, res) => {
    try {
      const events = await clientModel.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getEvent: async (req, res) => {
    try {
        const event = await clientModel.getEventById(req.params.id);
        if (event) {
          res.json(event);
        } else {
          res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
    },

    purchaseTicket: async (req, res) => {
        try {
            const result = await clientModel.purchaseTicket(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = clientController;