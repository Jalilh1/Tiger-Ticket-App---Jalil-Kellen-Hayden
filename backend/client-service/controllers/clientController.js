/**
 * Client API controller
 * Brief: HTTP handlers for listing/browsing events and purchasing tickets.
 */

const clientModel = require('../models/clientModel');

const clientController = {

  /**
   * Purpose: List public events that have inventory.
   * Params: (req, res)
   * Returns/Side effects: JSON list; 500 on failure.
   */
  listEvents: async (req, res) => {
    try {
      const events = await clientModel.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Purpose: Get single event details by id.
   * Params: (req.params.id: string)
   * Returns/Side effects: JSON event or 404/500.
   */
  getEvent: async (req, res) => {
    try {
        const event = await clientModel.getEventById(req.params.id);
        if (event) {
          res.json(event);
        } else {
          res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
    },

    /**
 * Purpose: Purchase tickets for an event.
 * Params: (req.body: { event_id:number, customer_name:string, customer_email:string, quantity:number})
 * Returns/Side effects: 201 + JSON purchase summary; 400 on validation/availability errors.
 */
  purchaseTicket: async (req, res) => {
    try {
      const { event_id, quantity } = req.body;
      const user_id = req.userId; // From JWT middleware

      // Validation
      if (!event_id || !quantity) {
        return res.status(400).json({ 
          error: 'Event ID and quantity are required' 
        });
      }

      if (quantity < 1 || quantity > 10) {
        return res.status(400).json({ 
          error: 'Quantity must be between 1 and 10' 
        });
      }

      // Purchase tickets
      const result = await clientModel.purchaseTicket({
        event_id,
        user_id,
        quantity
      });

      res.status(201).json(result);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = clientController;