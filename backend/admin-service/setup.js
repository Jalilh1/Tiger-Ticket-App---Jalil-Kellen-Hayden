/**
 * Database setup
 * Brief: Ensures DB directory exists and executes init SQL against SQLite.
 * Params: none
 * Returns: Promise<void> (rejects if init.sql missing or exec fails)
 * Side effects: Creates/updates DB file on disk.
 * // WHY: Centralize one-time schema creation so services can reuse it safely.
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../shared-db/database.sqlite');
const sqlPath = path.join(__dirname, '../shared-db/init.sql');

function initializeDatabase() {
    return new Promise((resolve, reject) => {

        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                return reject(err);
            }
});

    if (fs.existsSync(sqlPath)) {
        const initSql = fs.readFileSync(sqlPath, 'utf-8');

        db.exec(initSql, (err) => {
            if (err) {
                db.close();
                return reject(err);
            } else {
                db.close();
                return resolve();
            }
        });

    } else {
        db.close();
        return reject(new Error('SQL initialization file not found'));
    }
});
}

module.exports =  initializeDatabase ;
