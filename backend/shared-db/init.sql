/*
  SQLite DB Intialization Script and table schema.
  Purpose: Initialize SQLite database with events, users, and purchases tables.
  Side effects: Creates tables if not exist and seeds initial event data.
*/
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT (datetime('now'))
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    capacity INTEGER DEFAULT 0,
    available_tickets INTEGER DEFAULT 0
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    purchase_date TIMESTAMP DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed initial events
INSERT OR IGNORE INTO events (id, name, date, capacity, available_tickets) VALUES
    (1, 'Clemson Football Game', '2025-09-01', 80000, 15000),
    (2, 'Campus Concert', '2025-09-10', 5000, 500),
    (3, 'Career Fair', '2025-09-15', 2000, 2000);