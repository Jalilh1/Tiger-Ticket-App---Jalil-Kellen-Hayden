// controllers/clientController.js
// Purpose: HTTP handlers for events and ticket purchase, using clientModel + JWT auth.

const clientModel = require('../models/clientModel');

/**
 * GET /api/client/events
 * Returns list of events with available tickets.
 */
exports.listEvents = async (req, res) => {
  try {
    const events = await clientModel.getAllEvents();
    return res.json(events);
  } catch (err) {
    console.error('listEvents error:', err);
    return res.status(500).json({
      error: 'Failed to fetch events',
      details: err.message,
    });
  }
};

/**
 * GET /api/client/events/:id
 * Returns a single event by id.
 */
exports.getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await clientModel.getEventById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json(event);
  } catch (err) {
    console.error('getEvent error:', err);
    return res.status(500).json({
      error: 'Failed to fetch event',
      details: err.message,
    });
  }
};

/**
 * POST /api/client/purchase
 * Body: { eventId, quantity }
 * Requires auth (JWT via authMiddleware).
 */
exports.purchaseTicket = async (req, res) => {
  try {
    // authMiddleware sets req.userId and req.userEmail
    if (!req.userId) {
      console.error('purchaseTicket: req.userId is missing');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.userId;
    const { eventId, quantity } = req.body;

    if (!eventId || !quantity) {
      return res.status(400).json({ error: 'eventId and quantity are required' });
    }

    const purchaseData = {
      event_id: eventId,
      user_id: userId,
      quantity,
    };

    const result = await clientModel.purchaseTicket(purchaseData);

    return res.status(201).json({
      message: 'Purchase successful',
      purchase: {
        id: result.id,
        event_id: result.event_id,
        user_id: result.user_id,
        quantity: result.quantity,
      },
      updatedEvent: {
        id: result.event_id,
        // You can add more event fields here later if you extend clientModel
      },
    });
  } catch (err) {
    console.error('Purchase ticket error:', err);
    return res.status(500).json({
      error: 'Failed to purchase ticket',
      details: err.message,
    });
  }
};