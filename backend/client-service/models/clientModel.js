const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');

function getDBConnection() {
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Could not connect to database', err);
        } else {
            console.log('Connected to SQLite database');
        }
    });
}

const clientModel = {
    getAlleven
