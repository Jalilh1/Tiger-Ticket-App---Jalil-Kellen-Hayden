CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    capacity INT DEFAULT 0,
    available_tickets INT DEFAULT 0,
);

CREATE TABLE IF NOT EXISTS purchases {
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
}

INSERT INTO events (id, name, date, capacity, available_tickets) VALUES
    (1, 'Clemson Football Game', '2025-09-01', 80000, 15000),
    (2, 'Campus Concert', '2025-09-10', 5000, 500),
    (3, 'Career Fair', '2025-09-15', 2000, 2000);