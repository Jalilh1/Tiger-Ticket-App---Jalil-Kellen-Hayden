/**
 * Purpose: Unit test llmController handlers with model/DB mocked.
 */

jest.mock('../models/llmModel', () => ({
    parseBookingIntent: jest.fn().mockResolvedValue({
      intent: 'book',
      event_name: 'Campus Concert',
      quantity: 2,
      confidence: 'high'
    }),
    keywordFallback: jest.fn().mockReturnValue({
      intent: 'greeting', event_name: null, quantity: null, confidence: 'medium'
    })
  }));
  
  jest.mock('sqlite3', () => {
    const get = jest.fn();
    const all = jest.fn((_q, _p, cb) => cb(null, [{ id: 1, name: 'Campus Concert', capacity: 100, available_tickets: 5, date: '2025-12-01' }]));
    const run = jest.fn(function (_sql, _params, cb) { cb && cb.call({ lastID: 555, changes: 1 }, null); return this; });
  
    return {
      verbose: () => ({
        Database: function () { this.get = get; this.all = all; this.run = run; }
      })
    };
  });
  
  const llmModel = require('../models/llmModel');
  const llmController = require('../controllers/llmController');
  
  function res() { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; }
  
  test('parseBooking returns parsed intent', async () => {
    const r = res();
    await llmController.parseBooking({ body: { message: 'book tickets' } }, r);
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ intent: 'book' }));
  });
  
  test('parseBooking uses fallback on error', async () => {
    llmModel.parseBookingIntent.mockRejectedValueOnce(new Error('hf down'));
    const r = res();
    await llmController.parseBooking({ body: { message: 'hello' } }, r);
    expect(r.status).toHaveBeenCalledWith(500);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String), intent: 'greeting' }));
  });
  
  test('getAvailableEvents returns array', async () => {
    const r = res();
    await llmController.getAvailableEvents({}, r);
    expect(r.json).toHaveBeenCalledWith(expect.any(Array));
  });
  
  test('confirmBooking validates missing fields', async () => {
    const r = res();
    await llmController.confirmBooking({ body: {} }, r);
    expect(r.status).toHaveBeenCalledWith(400);
  });
  
  test('confirmBooking success path', async () => {
    // Mock DB get → event exists with stock >= qty
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database();
    db.get.mockImplementation((_q, _p, cb) => cb(null, { id: 1, name: 'Campus Concert', available_tickets: 5 }));
  
    const r = res();
    await llmController.confirmBooking({
      body: { event_id: 1, customer_name: 'Test', customer_email: 't@e.com', quantity: 1 }
    }, r);
  
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      purchase_id: expect.any(Number)
    }));
  });