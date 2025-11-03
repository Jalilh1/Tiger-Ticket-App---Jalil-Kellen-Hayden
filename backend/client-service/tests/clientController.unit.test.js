/**
 * Purpose: Unit test client controller without DB changes (mock model).
 * Params: none
 * Returns/Side effects: Pure controller behavior assertions.
 */

jest.mock('../models/clientModel', () => ({
    getAllEvents: jest.fn(),
    getEventById: jest.fn()
  }));
  
  const clientModel = require('../models/clientModel');
  const clientController = require('../controllers/clientController');
  
  function makeRes() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  }
  
  describe('clientController.listEvents', () => {
    test('returns array on success', async () => {
      clientModel.getAllEvents.mockResolvedValue([{ id: 1, name: 'Campus Concert' }]);
      const req = {};
      const res = makeRes();
  
      await clientController.listEvents(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  
    test('500 on model failure', async () => {
      clientModel.getAllEvents.mockRejectedValue(new Error('db fail'));
      const res = makeRes();
  
      await clientController.listEvents({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'db fail' });
    });
  });
  
  describe('clientController.getEvent', () => {
    test('200 with event', async () => {
      clientModel.getEventById.mockResolvedValue({ id: 2, name: 'CFB' });
      const req = { params: { id: '2' } };
      const res = makeRes();
  
      await clientController.getEvent(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 2, name: 'CFB' });
    });
  
    test('404 when not found', async () => {
      clientModel.getEventById.mockResolvedValue(null);
      const req = { params: { id: '999' } };
      const res = makeRes();
  
      await clientController.getEvent(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Event not found' });
    });
  });