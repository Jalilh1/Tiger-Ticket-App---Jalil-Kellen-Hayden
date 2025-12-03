const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { verify } = require('crypto');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../shared-db/database.sqlite');

function getDBConnection() {
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error connecting to databse', err);
        }
    });
}

const authModel = {
    registerUser: (userData) => {
        return new Promise(async (resolve, reject) => {
            const { email, name, password } = userData;

            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            const db = getDBConnection();

            db.run(
                'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
                [email, name, passwordHash],
                function (err) {
                    db.close();
                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            reject(new Error('Email already registered'));
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve({
                            id: this.lastID,
                            email,
                            name
                        });
                    }
                }
            );
        });
    },

    findUserByEmail: (email) => {
        return new Promise((resolve, reject) => {
            const db = getDBConnection();

            db.get(
                'SELECT id, email, name, password_hash FROM users WHERE email = ?',
                [email],
                (err, row) => {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    },

    verifyPassword: async (plainPassword, passwordHash) => {
        return await bcrypt.compare(plainPassword, passwordHash);
    },

    getUserById: (userId) => {
        return new Promise((resolve, reject) => {
            const db = getDBConnection();

            db.get(
                'SELECT id, email, name, created_at FROM users WHERE id = ?',
                [userId],
                (err, row) => {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }
};

module.exports = authModel;