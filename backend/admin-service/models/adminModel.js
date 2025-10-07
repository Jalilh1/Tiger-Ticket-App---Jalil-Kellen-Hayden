/**
 * Admin data model
 * Brief: SQLite accessors for admin event CRUD.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');

/**
 * Establish SQLite database connection
 */
function getDbConnection() {
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Could not connect to database', err);
        }
    });
}

const adminModel = {

    /**
     * Purpose: Fetch all events ordered by date.
     * Params: none
     * Returns: Promise<Event[]>
     */
    getAllEvents: () => {
        return new Promise((resolve, reject) => {
            const db = getDbConnection();
            db.all('SELECT * FROM events ORDER BY date', [], (err, rows) => {
                db.close();
                if (err) reject(err)
                    else resolve(rows);
                });
        });
    },

    /**
     * Purpose: Fetch a single event by id.
     * Params: (id: string|number)
     * Returns: Promise<Event|null>
     */
    getEventById: (id) => {
        return new Promise((resolve, reject) => {
            const db = getDbConnection();
            db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
                db.close();
                if (err) reject(err)
                    else resolve(row);
                });
        });
    },

    /**
     * Purpose: Insert a new event.
     * Params: (eventData: { name:string, date:string, capacity:number, available_tickets:number })
     * Returns: Promise<{ id:number, name:string, date:string, capacity:number, available_tickets:number }>
     */
    createEvent: (eventData) => {
    return new Promise((resolve, reject) => {
      const { name, date, capacity, available_tickets } = eventData;
      const db = getDbConnection();

      const sql = `INSERT INTO events (name, date, capacity, available_tickets)
                   VALUES (?, ?, ?, ?)`;

      db.run(sql, [name, date, capacity, available_tickets], function (err) {
        db.close();
        if (err) {
          console.error('SQLite insert error:', err);  
          return reject(err);
        }
        resolve({ id: this.lastID, name, date, capacity, available_tickets });
      });
    });
  },

    /**
     * Purpose: Update fields of an event by id.
     * Params: (id: string|number, eventData: Partial<Event>)
     * Returns: Promise<{ id: string|number } & Partial<Event>>
     * // WHY: Resolve with the canonical updated payload so controllers don't need DB metadata.
     */
    updateEvent: (id, eventData) => {
        return new Promise((resolve, reject) => {
            const { name, date, capacity, available_tickets } = eventData;
            const db = getDbConnection();

            db.run(
                'UPDATE events SET name = ?, date = ?, capacity = ?, available_tickets = ? WHERE id = ?',
                [name, date, capacity, available_tickets, id],
                function (err) {
                    db.close();
                    if (err) reject(err);
                        else resolve({ id, ...eventData });
                }
            );
        });
    },

    /**
     * Purpose: Delete an event by id.
     * Params: (id: string|number)
     * Returns: Promise<{ id: string|number, changes: number }>
     */
    deleteEvent: (id) => {
        return new Promise((resolve, reject) => {
            const db = getDbConnection();
            db.run('DELETE FROM events WHERE id = ?', [id], function (err) {
                db.close();
                if (err) reject(err);
                    else resolve({ id, changes: this.changes });
                });
        });
    }
};

module.exports = adminModel ;