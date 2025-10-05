
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../shared-db/database.sqlite');


function getDbConnection() {
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Could not connect to database', err);
        }
    });
}

const adminModel = {
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

    createEvent: (eventData) => {
        return new Promise((resolve, reject) => {
            const db = getDbConnection();
            const { name, date, location, description } = eventData;
module.exports = { adminModel };