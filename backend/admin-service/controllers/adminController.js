/**
 * Admin API Controller
 * HTTP handlers for admin CRUD operations
 */

const adminModel  = require('../models/adminModel');


const adminController = {
    /**
    * Purpose: Return all events for admin management.
    * Params: (req: Express.Request, res: Express.Response)
    * Returns/Side effects: JSON list; 500 on failure.
    */
    listEvents: async (req, res) => {
        try {
            const events = await adminModel.getAllEvents();
            res.json(events);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve events' });
        }
    },
    /**
     * Purpose: Return one event by id.
     * Params: (req.params.id: string), (req, res)
     * Returns/Side effects: JSON event or 404/500.
     */
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
    /**
     * Purpose: Create a new event from request body.
     * Params: (req.body: { name:string, date:string, capacity:number, available_tickets:number })
     * Returns/Side effects: 201 + JSON of created event; 500 on failure.
     */
    createEvent: async (req, res) => {
        try {
            const newEvent = await adminModel.createEvent(req.body);
            res.status(201).json(newEvent);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create event' });
        }
    },

    /**
     * Purpose: Update an existing event by id.
     * Params: (req.params.id: string, req.body: Partial<Event>)
     * Returns/Side effects: JSON confirmation or 404/500.
     */
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


    /**
     * Purpose: Delete an event by id.
     * Params: (req.params.id: string)
     * Returns/Side effects: JSON confirmation or 404/500.
     */
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

module.exports =  adminController;