const path = require('path');
const bcrypt = require('bcryptjs');
const { verify } = require('crypto');

// auth-service/models/authModel.js
const pool = require('../db');

const authModel = {
  /**
   * Create a new user.
   * Returns: { id, email, name }
   */
  registerUser: async ({ email, name, password }) => {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      const result = await pool.query(
        `INSERT INTO users (email, name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, name`,
        [email, name, passwordHash]
      );

      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        // unique_violation on email
        throw new Error('Email already registered');
      }
      throw err;
    }
  },

  /**
   * Find a user by email (for login).
   * Returns: { id, email, name, password_hash } | null
   */
  findUserByEmail: async (email) => {
    const result = await pool.query(
      `SELECT id, email, name, password_hash
       FROM users
       WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  },

  /**
   * Compare plain password with stored hash.
   */
  verifyPassword: async (plainPassword, passwordHash) => {
    return bcrypt.compare(plainPassword, passwordHash);
  },

  /**
   * Get user by id (for /me).
   * Returns: { id, email, name, created_at } | null
   */
  getUserById: async (userId) => {
    const result = await pool.query(
      `SELECT id, email, name, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }
};

module.exports = authModel;