/**
 * Purpose: Unit test admin model with sqlite3 mocked.
 */

jest.mock('sqlite3', () => {
    const all = jest.fn((_q, _p, cb) => cb(null, [{ id: 1 }]));
    const get = jest.fn((_q, _p, cb) => cb(null, { id: 1 }));
    const run = jest.fn(function (_sql, _params, cb) { cb && cb.call({ lastID: 77, changes: 1 }, null); return this; });
    const close = jest.fn();
  
    return {
      verbose: () => ({
        Database: function () { this.all = all; this.get = get; this.run = run; this.close = close; }
      })
    };
  });
  
  const adminModel = require('../models/adminModel');
  
  test('createEvent resolves with id and fields', async () => {
    const out = await adminModel.createEvent({ name: 'A', date: '2025-12-01', capacity: 100, price: 25 });
    expect(out).toEqual(expect.objectContaining({ id: 77, name: 'A' }));
  });
  
  test('updateEvent returns merged event', async () => {
    const out = await adminModel.updateEvent(1, { name: 'B' });
    expect(out).toEqual(expect.objectContaining({ id: 1, name: 'B' }));
  });
  
  test('deleteEvent returns changes', async () => {
    const out = await adminModel.deleteEvent(1);
    expect(out).toEqual(expect.objectContaining({ id: 1, changes: 1 }));
  });