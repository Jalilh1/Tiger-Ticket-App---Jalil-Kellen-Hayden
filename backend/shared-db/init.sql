CREATE TABLE IF NOT EXISTS events (
    event_id SERIAL PRIMARY KEY,
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