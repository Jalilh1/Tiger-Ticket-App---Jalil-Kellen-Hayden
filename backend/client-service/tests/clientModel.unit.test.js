/**
 * Purpose: Unit test client model methods by mocking sqlite3.
 * Params: none
 * Returns/Side effects: Ensure SQL paths resolve correctly.
 */

jest.mock('sqlite3', () => {
    const all = jest.fn();
    const get = jest.fn();
    const run = jest.fn(function (_sql, _params, cb) { cb && cb.call({ lastID: 42 }, null); return this; });
    const close = jest.fn();
  
    return {
      verbose: () => ({
        Database: function () {
          this.all = all;
          this.get = get;
          this.run = run;
          this.close = close;
        }
      })
    };
  });
  
  const clientModel = require('../models/clientModel');
  
  describe('clientModel.getAllEvents', () => {
    test('resolves to array', async () => {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database();
      db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
  
      const rows = await clientModel.getAllEvents();
      expect(Array.isArray(rows)).toBe(true);
    });
  });
  
  describe('clientModel.purchaseTicket', () => {
    test('rejects when not enough tickets', async () => {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database();
      db.get.mockImplementationOnce((_sql, _p, cb) => cb(null, { id: 1, available_tickets: 1 })); // read event
  
      await expect(clientModel.purchaseTicket(1, 'User', 'u@e.com', 2))
        .rejects.toThrow(/Not enough tickets/i);
    });
  
    test('resolves with purchase summary on success', async () => {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database();
  
      // event exists with stock
      db.get.mockImplementationOnce((_sql, _p, cb) => cb(null, { id: 1, name: 'Campus Concert', available_tickets: 5 }));
  
      // insert purchase => lastID set by mock
      // update stock => success
  
      const out = await clientModel.purchaseTicket(1, 'User', 'u@e.com', 1);
      expect(out).toEqual(expect.objectContaining({
        id: 42,
        message: expect.stringMatching(/success/i)
      }));
    });
  });