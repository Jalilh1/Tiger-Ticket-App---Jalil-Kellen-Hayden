import React, { useEffect, useState } from 'react';
import './App.css';


function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');



  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = () => {
    fetch('/api/client/events')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch events');
        setLoading(false);
        console.error('There was a problem with the fetch operation:', err);
      });
  };

  const buyTicket = (eventId, eventName) => {
    const customerName = prompt('Enter your name:');
    if (!customerName) {
      alert('Name is required to buy a ticket.');
      return;
    }

    const customerEmail = prompt('Enter your email:');
    if (!customerEmail) {
      alert('Email is required to buy a ticket.');
      return;
    }

    const quantityStr = prompt('Enter number of tickets to buy:');
    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid number of tickets.');
      return;
    }

    fetch('/api/client/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        customer_name: customerName,
        customer_email: customerEmail,
        quantity: quantity
      })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(err => {
            throw new Error(err.error || 'Failed to purchase tickets');
          });
        }
        return res.json();
      })
      .then((data) => {
        setMessage(`Successfully purchased ${quantity} ticket(s) for ${eventName}`);
        setTimeout(() => setMessage(''), 3000);
        fetchEvents(); // Refresh events to update available tickets
      })
      .catch((err) => {
        setMessage('Error purchasing tickets: ' + err.message);
        setTimeout(() => setMessage(''), 5000);
        console.error('Error during ticket purchase:', err);
      });
    };

    if (loading) {
      return (
        <div className="App">
          <h1>Clemson Campus Events</h1>
          <p>Loading events...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="App">
          <h1>Clemson Campus Events</h1>
          <p className="error">{error}</p>
        </div>
      );
    }

    return (
      <div className="App">
        <h1>Clemson Campus Events</h1>
        {message && (
          <div className="message">{message}</div>
        )}
        {events.length === 0 ? (
          <p>No events available at the moment.</p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <div className= "event-info">
                  <strong>{event.name}</strong>
                  <span> - {event.date}</span>
                <br />
                <span className="tickets-available">
                  {event.available_tickets} ticket(s) available
                </span>
                </div>
                <button 
                  onClick={() => buyTicket(event.id, event.name)}
                  disabled={event.available_tickets === 0}
                  className={event.available_tickets === 0 ? 'sold-out' : ''}
                  >
                  {event.available_tickets === 0 ? 'Sold Out' : 'Buy Ticket'}
                  </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      );
    }
export default App;
