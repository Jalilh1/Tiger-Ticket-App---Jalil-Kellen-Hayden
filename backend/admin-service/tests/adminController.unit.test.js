/**
 * Purpose: Unit test admin controller by mocking model methods.
 */

jest.mock('../models/adminModel', () => ({
    getAllEvents: jest.fn(),
    getEventById: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn()
  }));
  
  const adminModel = require('../models/adminModel');
  const adminController = require('../controllers/adminController');
  
  function mkRes() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  }
  
  test('listEvents returns 200 with array', async () => {
    adminModel.getAllEvents.mockResolvedValue([{ id: 1 }]);
    const res = mkRes();
    await adminController.listEvents({}, res);
    expect(res.json).toHaveBeenCalledWith(expect.any(Array));
  });
  
  test('getEvent 404 when missing', async () => {
    adminModel.getEventById.mockResolvedValue(null);
    const res = mkRes();
    await adminController.getEvent({ params: { id: '9' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  
  test('createEvent 201 with payload', async () => {
    adminModel.createEvent.mockResolvedValue({ id: 99, name: 'New', date: '2025-12-01', capacity: 100, price: 10 });
    const res = mkRes();
    await adminController.createEvent({ body: { name: 'New', date: '2025-12-01', capacity: 100, price: 10 } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 99 }));
  });
  
  test('updateEvent 404 when no change', async () => {
    adminModel.updateEvent.mockResolvedValue(null);
    const res = mkRes();
    await adminController.updateEvent({ params: { id: '1' }, body: { name: 'X' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  
  test('deleteEvent ok', async () => {
    adminModel.deleteEvent.mockResolvedValue({ id: 1, changes: 1 });
    const res = mkRes();
    await adminController.deleteEvent({ params: { id: '1' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });