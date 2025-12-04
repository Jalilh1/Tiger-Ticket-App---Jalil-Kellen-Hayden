/**
 * File: llmController.js
 * Brief: HTTP handlers for LLM-powered parsing and booking endpoints.
 *
 * Responsibilities:
 * - Validate incoming requests.
 * - Call llmModel to parse intents, fetch events, and confirm bookings.
 * - Translate domain errors into appropriate HTTP responses.
 */

const TigerTixLLM = require('../models/llmModel');

/**
 * Controller object exposing route handlers for the LLM service.
 */
const llmController = {
  /**
   * Purpose: Parse a free-text message using the LLM and return the extracted intent.
   * Route: POST /api/llm/parse
   * Body: { message: string }
   * Returns:
   *   - 200: { intent, event_name, quantity, confidence }
   *   - 400: if message is missing/empty
   *   - 500: if LLM + fallback both fail unexpectedly
   */
  parseBooking: async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || message.trim() === '') {
        return res.status(400).json({
          error: 'Message is required',
          fallback: 'Please provide a valid message.'
        });
      }

      const parsedIntent = await TigerTixLLM.parseBookingIntent(message);

      return res.status(200).json({
        intent: parsedIntent.intent,
        event_name: parsedIntent.event_name,
        quantity: parsedIntent.quantity,
        confidence: parsedIntent.confidence
      });
    } catch (error) {
      console.error('LLM parsing error:', error);

      const fallback = TigerTixLLM.keywordFallback(
        req.body && req.body.message ? req.body.message : ''
      );

      return res.status(500).json({
        error: 'LLM parsing failed, using fallback',
        ...fallback
      });
    }
  },

  /**
   * Purpose: Return all events with available tickets using Postgres.
   * Route: GET /api/llm/events
   * Auth: none required (read-only).
   * Returns:
   *   - 200: [ { id, name, date, capacity, available_tickets }, ... ]
   *   - 500: on DB errors.
   */
  getAvailableEvents: async (_req, res) => {
    try {
      const events = await TigerTixLLM.getAvailableEvents();
      return res.status(200).json(events);
    } catch (err) {
      console.error('Database query error (getAvailableEvents)', err);
      return res.status(500).json({ error: 'Failed to retrieve events' });
    }
  },

  /**
   * Purpose: Confirm a booking after user explicitly approves via UI.
   * Route: POST /api/llm/confirm
   * Body: { event_id: number, quantity: number }
   * Auth: requires valid JWT; user identity taken from req.user / req.userId.
   * Returns:
   *   - 200: booking summary
   *   - 400: validation errors (missing fields, bad quantity)
   *   - 404: event not found
   *   - 409/400: not enough tickets
   *   - 500: DB/transaction errors
   */
  confirmBooking: async (req, res) => {
    try {
      const { event_id, quantity } = req.body;

      // Support both req.user.id (new authMiddleware) and req.userId (older usage)
      const user_id = (req.user && req.user.id) || req.userId;

      if (!user_id) {
        return res.status(401).json({
          error: 'Unauthorized: missing user context'
        });
      }

      if (!event_id || !quantity) {
        return res.status(400).json({
          error: 'Missing required fields: event_id, quantity'
        });
      }

      const numericQty = Number(quantity);
      if (!Number.isFinite(numericQty) || numericQty < 1) {
        return res.status(400).json({
          error: 'Quantity must be a positive integer'
        });
      }

      const result = await TigerTixLLM.confirmBooking({
        event_id,
        user_id,
        quantity: numericQty
      });

      return res.status(200).json({
        success: true,
        message: `Successfully booked ${numericQty} ticket(s) for ${result.event_name}`,
        purchase: result.purchase,
        event_name: result.event_name,
        quantity: numericQty
      });
    } catch (err) {
      console.error('Error in confirmBooking:', err);

      if (err.message === 'Event not found') {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (err.message === 'Not enough tickets available') {
        return res.status(400).json({ error: 'Not enough tickets available' });
      }

      return res.status(500).json({ error: 'Failed to confirm booking' });
    }
  }
};

module.exports = llmController;