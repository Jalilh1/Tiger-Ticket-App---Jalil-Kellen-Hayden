CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(100) NOT NULL,
    capacity INT DEFAULT 0,
    available_tickets INT DEFAULT 0,
    price REAL DEFAULT 0.00,
    description TEXT
);

CREATE TABLE IF NOT EXISTS purchases {
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    total_price REAL DEFAULT 0.00,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
}

INSERT INTO events (id, name, date, location, capacity, available_tickets, price, description) VALUES
    (1, 'Clemson Football Game', '2025-09-01', 'Memorial Stadium', 80000, 15000, 75.00),
    (2, 'Campus Concert', '2025-09-10', 'Amphitheater', 5000, 500, 25.00),
    (3, 'Career Fair', '2025-09-15', 'Hendrix Center', 2000, 2000, 0.00);