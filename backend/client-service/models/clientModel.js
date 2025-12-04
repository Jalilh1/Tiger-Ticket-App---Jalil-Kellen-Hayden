/**
 * Client data model
 * Brief: SQLite reads for events and transactional ticket purchase.
 */
const path = require('path');

const authMiddleware = require('../middleware/authMiddleware');

// client-service/models/clientModel.js
const pool = require('../db');

const clientModel = {
  /**
   * Get all events with remaining inventory.
   */
  getAllEvents: async () => {
    const result = await pool.query(
      `SELECT id, name, date, capacity, available_tickets
       FROM events
       WHERE available_tickets > 0
       ORDER BY date ASC, id ASC`
    );
    return result.rows;
  },

  /**
   * Get a single event by id.
   */
  getEventById: async (id) => {
    const result = await pool.query(
      `SELECT id, name, date, capacity, available_tickets
       FROM events
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Purchase ticket(s) and decrement inventory atomically.
   * purchaseData: { event_id, user_id, quantity }
   */
  purchaseTicket: async ({ event_id, user_id, quantity }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock row FOR UPDATE to avoid race conditions
      const eventRes = await client.query(
        `SELECT id, available_tickets
         FROM events
         WHERE id = $1
         FOR UPDATE`,
        [event_id]
      );

      const event = eventRes.rows[0];
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.available_tickets < quantity) {
        throw new Error('Not enough tickets available');
      }

      const purchaseRes = await client.query(
        `INSERT INTO purchases (event_id, user_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING id, event_id, user_id, quantity, purchase_date`,
        [event_id, user_id, quantity]
      );

      await client.query(
        `UPDATE events
         SET available_tickets = available_tickets - $1
         WHERE id = $2`,
        [quantity, event_id]
      );

      await client.query('COMMIT');

      const purchase = purchaseRes.rows[0];
      return {
        ...purchase,
        message: 'Ticket purchased successfully!'
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = clientModel;