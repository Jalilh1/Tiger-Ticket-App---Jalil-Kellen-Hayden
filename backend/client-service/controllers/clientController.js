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
const purchaseTicket = async (req, res) => {
  try {
    console.log('purchaseTicket body:', req.body);
    console.log('purchaseTicket user:', req.user);

    // Accept both eventId and event_id to be safe
    const { eventId, event_id, quantity } = req.body || {};
    const finalEventId = eventId ?? event_id;

    if (!finalEventId || !quantity) {
      return res.status(400).json({ error: 'Event ID and quantity are required' });
    }

    if (!req.user || !req.user.id) {
      console.error('purchaseTicket: req.user missing or malformed:', req.user);
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;

    // use your existing model function
    const purchase = await clientModel.createPurchase({
      eventId: finalEventId,
      userId,
      quantity: Number(quantity),
    });

    console.log('purchaseTicket success:', purchase);
    return res.status(201).json(purchase);
  } catch (error) {
    console.error('Purchase ticket error:', error);
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