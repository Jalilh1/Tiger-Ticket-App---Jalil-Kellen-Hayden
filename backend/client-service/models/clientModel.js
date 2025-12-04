// models/clientModel.js
// Purpose: Ticket purchasing and user-specific purchase queries using Postgres.

const pool = require('../db');

/**
 * Purchase tickets for a user & event in a transaction.
 * - Checks available_tickets with row lock
 * - Inserts purchase record
 * - Decrements available_tickets
 */
async function purchaseTicket({ userId, eventId, quantity }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventRes = await client.query(
      'SELECT id, name, available_tickets FROM events WHERE id = $1 FOR UPDATE',
      [eventId]
    );

    if (eventRes.rowCount === 0) {
      throw new Error('Event not found');
    }

    const event = eventRes.rows[0];

    if (event.available_tickets < quantity) {
      throw new Error('Not enough tickets available');
    }

    const purchaseRes = await client.query(
      `INSERT INTO purchases (event_id, user_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING id, event_id, user_id, quantity, purchase_date`,
      [eventId, userId, quantity]
    );

    await client.query(
      `UPDATE events
       SET available_tickets = available_tickets - $1
       WHERE id = $2`,
      [quantity, eventId]
    );

    await client.query('COMMIT');

    return {
      purchase: purchaseRes.rows[0],
      event: {
        id: event.id,
        name: event.name,
        remaining: event.available_tickets - quantity,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[clientModel] purchaseTicket error:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Optional helper: get all purchases for a user.
 */
async function getPurchasesByUser(userId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.event_id, e.name AS event_name,
            p.quantity, p.purchase_date
     FROM purchases p
     JOIN events e ON p.event_id = e.id
     WHERE p.user_id = $1
     ORDER BY p.purchase_date DESC`,
    [userId]
  );
  return rows;
}

// Export aliases so older controller names still work
module.exports = {
  purchaseTicket,
  createPurchase: purchaseTicket,
  getPurchasesByUser,
};