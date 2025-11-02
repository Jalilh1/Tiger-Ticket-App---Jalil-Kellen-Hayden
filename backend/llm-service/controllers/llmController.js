const llmModel = require('../models/llmModel');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');

const llmController = {
    // Parse a free-text message using the LLM and return the extracted intent
    parseBooking: async (req, res) => {
        try {
            const { message } = req.body;

            if (!message || message.trim() === '') {
                return res.status(400).json({
                    error: 'Message is required',
                    fallback: 'Please provide a valid message.'
                });
            }

            const parsedIntent = await llmModel.parseBookingIntent(message);

            return res.status(200).json({
                intent: parsedIntent.intent,
                event_name: parsedIntent.event_name,
                quantity: parsedIntent.quantity,
                confidence: parsedIntent.confidence
            });
        } catch (error) {
            console.error('LLM parsing error:', error);

            const fallback = llmModel.keywordFallback(req.body && req.body.message ? req.body.message : '');
            return res.status(500).json({
                error: 'LLM parsing failed, using fallback',
                ...fallback
            });
        }
    },

    getAvailableEvents: (req, res) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Could not connect to database', err);
                return res.status(500).json({ error: 'Database connection failed' });
            }
        });

        db.all(
            'SELECT id, name, date, capacity, available_tickets FROM events WHERE available_tickets > 0 ORDER BY date',
            [],
            (err, rows) => {
                db.close();
                if (err) {
                    console.error('Database query error', err);
                    return res.status(500).json({ error: 'Failed to retrieve events' });
                }
                return res.status(200).json(rows);
            }
        );
    },

    confirmBooking: (req, res) => {
        const { event_id, customer_name, customer_email, quantity } = req.body;

        if (!event_id || !customer_name || !customer_email || !quantity) {
            return res.status(400).json({
                error: 'Missing required fields: event_id, customer_name, customer_email, quantity'
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                error: 'Quantity must be at least 1'
            });
        }

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Could not connect to database', err);
                return res.status(500).json({ error: 'Database connection failed' });
            }
        });

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            db.get(
                'SELECT id, name, available_tickets FROM events WHERE id = ?',
                [event_id],
                (err, event) => {
                    if (err) {
                        db.run('ROLLBACK');
                        db.close();
                        console.error('Database query error', err);
                        return res.status(500).json({ error: 'Database error: ' + err.message });
                    }
                    if (!event) {
                        db.run('ROLLBACK');
                        db.close();
                        return res.status(404).json({ error: 'Event not found' });
                    }
                    if (event.available_tickets < quantity) {
                        db.run('ROLLBACK');
                        db.close();
                        return res.status(400).json({
                            error:
                                'Only ' + event.available_tickets + ' ticket(s) available for ' + event.name
                        });
                    }

                    db.run(
                        'INSERT INTO purchases (event_id, customer_name, customer_email, quantity) VALUES (?, ?, ?, ?)',
                        [event_id, customer_name, customer_email, quantity],
                        function (insertErr) {
                            if (insertErr) {
                                db.run('ROLLBACK');
                                db.close();
                                return res.status(500).json({ error: 'Failed to create purchase: ' + insertErr.message });
                            }

                            const purchaseId = this.lastID;

                            db.run(
                                'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
                                [quantity, event_id],
                                (updateErr) => {
                                    if (updateErr) {
                                        db.run('ROLLBACK');
                                        db.close();
                                        return res.status(500).json({ error: 'Failed to update tickets: ' + updateErr.message });
                                    }

                                    db.run('COMMIT', (commitErr) => {
                                        db.close();

                                        if (commitErr) {
                                            return res.status(500).json({ error: 'Failed to commit transaction: ' + commitErr.message });
                                        }

                                        return res.status(200).json({
                                            success: true,
                                            message:
                                                'Successfully booked ' + quantity + ' ticket(s) for ' + event.name,
                                            purchase_id: purchaseId,
                                            event_id: event_id,
                                            event_name: event.name,
                                            quantity: quantity,
                                            customer_name: customer_name,
                                            customer_email: customer_email
                                        });
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    }
};

module.exports = llmController;
