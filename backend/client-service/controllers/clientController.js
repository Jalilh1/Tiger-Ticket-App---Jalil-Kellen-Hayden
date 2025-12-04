// controllers/clientController.js
// Purpose: HTTP handlers for ticket purchase, using clientModel + JWT auth.

const clientModel = require('../models/clientModel');

exports.purchaseTicket = async (req, res) => {
  try {
    const userId = req.user?.id; // injected by authMiddleware
    const { eventId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', requiresAuth: true });
    }

    if (!eventId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'eventId and positive quantity are required' });
    }

    const result = await clientModel.purchaseTicket({
      userId,
      eventId,
      quantity: Number(quantity),
    });

    return res.status(201).json({
      message: 'Ticket purchase successful',
      purchase: result.purchase,
      event: result.event,
    });
  } catch (err) {
    console.error('[clientController] purchaseTicket error:', err);

    if (err.message === 'Event not found') {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (err.message === 'Not enough tickets available') {
      return res.status(400).json({ error: 'Not enough tickets available' });
    }

    return res.status(500).json({ error: 'Failed to purchase ticket' });
  }
};