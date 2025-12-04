// backend/client-service/controllers/clientController.js

/**
 * Client service controller.
 * Handles HTTP layer, relies on clientModel for DB access.
 */

const clientModel = require('../models/clientModel');

/**
 * GET /api/client/events
 * Return list of events for the logged-in (or even anonymous) user.
 * (If you want this to require auth, ensure authMiddleware is on the route.)
 */
async function getEvents(req, res) {
  try {
    const events = await clientModel.getEvents();
    return res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}

/**
 * POST /api/client/purchase
 * Body: { eventId, quantity }
 * Requires authMiddleware so req.user is set.
 */
async function purchaseTicket(req, res) {
  try {
    // authMiddleware should set req.user
    const user = req.user;

    // Extra safety: support either id or userId in the JWT payload
    const userId = user && (user.id || user.userId);
    if (!userId) {
      console.error('purchaseTicket: Missing user id on req.user:', user);
      return res.status(401).json({ error: 'Unauthorized: user id missing' });
    }

    const { eventId, quantity } = req.body;

    if (!eventId || !quantity) {
      return res.status(400).json({
        error: 'eventId and quantity are required',
      });
    }

    const purchase = await clientModel.createPurchase(
      Number(userId),
      Number(eventId),
      Number(quantity)
    );

    return res.status(201).json({
      success: true,
      purchase,
    });
  } catch (err) {
    console.error('Purchase ticket error:', err);

    if (err.message === 'Event not found' || err.message === 'Not enough tickets available') {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Failed to purchase ticket' });
  }
}

/**
 * Optional: GET /api/client/purchases
 * If you have a “My Tickets” page.
 */
async function getMyPurchases(req, res) {
  try {
    const user = req.user;
    const userId = user && (user.id || user.userId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: user id missing' });
    }

    const purchases = await clientModel.getPurchasesByUser(Number(userId));
    return res.json(purchases);
  } catch (err) {
    console.error('Error fetching purchases for user:', err);
    return res.status(500).json({ error: 'Failed to fetch purchases' });
  }
}

module.exports = {
  getEvents,
  purchaseTicket,
  getMyPurchases,
};