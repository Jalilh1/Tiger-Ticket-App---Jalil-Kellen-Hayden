// backend/client-service/models/clientModel.js

/**
 * Client service data-access layer.
 * Uses shared PostgreSQL pool from db.js (no sqlite).
 */

const pool = require('../db');

/**
 * Get all events (for client browsing).
 */
async function getEvents() {
  const query = `
    SELECT id, name, date, capacity, available_tickets
    FROM events
    ORDER BY date ASC;
  `;

  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Create a ticket purchase for a user.
 * This is wrapped in a transaction so that:
 *  - We lock the event row
 *  - Check availability
 *  - Decrement available_tickets
 *  - Insert purchase row
 */
async function createPurchase(userId, eventId, quantity) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock the event row to avoid race conditions
    const eventResult = await client.query(
      `SELECT id, available_tickets 
       FROM events 
       WHERE id = $1 
       FOR UPDATE`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error('Event not found');
    }

    const event = eventResult.rows[0];

    if (event.available_tickets < quantity) {
      throw new Error('Not enough tickets available');
    }

    // Decrement available tickets
    await client.query(
      `UPDATE events
       SET available_tickets = available_tickets - $1
       WHERE id = $2`,
      [quantity, eventId]
    );

    // Insert purchase record
    const purchaseResult = await client.query(
      `INSERT INTO purchases (event_id, user_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING id, event_id, user_id, quantity, purchase_date`,
      [eventId, userId, quantity]
    );

    await client.query('COMMIT');
    return purchaseResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get all purchases for one user (for receipts/history).
 */
async function getPurchasesByUser(userId) {
  const query = `
    SELECT 
      p.id,
      p.event_id,
      p.user_id,
      p.quantity,
      p.purchase_date,
      e.name       AS event_name,
      e.date       AS event_date
    FROM purchases p
    JOIN events e ON p.event_id = e.id
    WHERE p.user_id = $1
    ORDER BY p.purchase_date DESC;
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
}

module.exports = {
  getEvents,
  createPurchase,
  getPurchasesByUser,
};