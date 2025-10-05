const { adminModel } = require('../../models/adminModel');


const adminController = {
    listAllEvents: async (req, res) => {
        try {
            const events = await adminModel.getAllEvents();
            res.json(events);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve events' });
        }
    },

    getEvent: async (req, res) => {
        try {
            const event = await adminModel.getEventById(req.params.id);
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ error: 'Event not found' });
        } 
    }   catch (error) {
        res.status(500).json({ error: 'Failed to retrieve event' });
    }
},

    createEvent: async (req, res) => {
        try {
            const newEvent = await adminModel.createEvent(req.body);
            res.status(201).json(newEvent);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create event' });
        }
    },

    updateEvent: async (req, res) => {
        try {
            const updatedEvent = await adminModel.updateEvent(req.params.id, req.body);
            if (updatedEvent.changes > 0) {
                res.json({ message: 'Event updated successfully', ...result });
            } else {
                res.status(404).json({ error: 'Event not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to update event' });
        }
    },

    deleteEvent: async (req, res) => {
        try {
            const result = await adminModel.deleteEvent(req.params.id);
            if (result.changes > 0) {
                res.json({ message: 'Event deleted successfully' });
            } else {
                res.status(404).json({ error: 'Event not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete event' });
        }
    },
};

module.exports = { adminController };