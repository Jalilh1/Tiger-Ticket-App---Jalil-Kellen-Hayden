// controllers/clientController.js
// Purpose: HTTP handlers for ticket purchase, using clientModel + JWT auth.

const clientModel = require('../models/clientModel');

exports.purchaseTicket = async (req, res) => {
  try {
    if (!req.user) {
      console.error('purchaseTicket: req.user is missing');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const { eventId, quantity } = req.body;

    if (!eventId || !quantity) {
      return res.status(400).json({ error: 'eventId and quantity are required' });
    }

    const result = await clientModel.purchaseTicket(userId, eventId, quantity);

    return res.status(201).json({
      message: 'Purchase successful',
      purchase: result.purchase,
      updatedEvent: result.updatedEvent,
    });
  } catch (err) {
    console.error('Purchase ticket error:', err);
    return res.status(500).json({
      error: 'Failed to purchase ticket',
      details: err.message, // TEMP: helps debug while you’re testing
    });
  }
};