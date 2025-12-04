// admin-service/models/adminModel.js
const pool = require('../db');

const adminModel = {
  /**
   * Fetch all events ordered by date.
   */
  getAllEvents: async () => {
    const result = await pool.query(
      `SELECT id, name, date, capacity, available_tickets
       FROM events
       ORDER BY date ASC, id ASC`
    );
    return result.rows;
  },

  /**
   * Fetch a single event by id.
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
   * Insert a new event.
   */
  createEvent: async ({ name, date, capacity, available_tickets }) => {
    const result = await pool.query(
      `INSERT INTO events (name, date, capacity, available_tickets)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, date, capacity, available_tickets`,
      [name, date, capacity, available_tickets]
    );
    return result.rows[0];
  },

  /**
   * Update an event by id.
   * Returns updated row or null if not found.
   */
  updateEvent: async (id, { name, date, capacity, available_tickets }) => {
    const result = await pool.query(
      `UPDATE events
       SET name = $1,
           date = $2,
           capacity = $3,
           available_tickets = $4
       WHERE id = $5
       RETURNING id, name, date, capacity, available_tickets`,
      [name, date, capacity, available_tickets, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Delete an event by id.
   * Returns: { id, deleted: boolean }
   */
  deleteEvent: async (id) => {
    const result = await pool.query(
      `DELETE FROM events
       WHERE id = $1`,
      [id]
    );
    return { id, deleted: result.rowCount > 0 };
  }
};

module.exports = adminModel;