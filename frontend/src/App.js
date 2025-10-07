/**
 * App (React component)
 * Purpose: Fetch and display campus events; allow ticket purchase.
 * Params: none (uses internal state + browser fetch).
 * Returns: JSX tree rendering header, status message, and event list.
 * Side effects: Network requests to /api/client/events and /api/client/purchase.
 */

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
  
  /**
   * fetchEvents
   * Purpose: Load events from server and hydrate UI state.
   * Params: none (closes over setEvents/setLoading/setError).
   * Returns: void (updates React state).
   * Side effects: GET /api/client/events; sets loading/error flags.
   */
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

  /**
   * buyTicket
   * Purpose: Collect purchaser info and submit ticket order.
   * Params:
   *   - eventId: number — target event identifier
   *   - eventName: string — for friendly success message
   * Returns: void (updates message state; triggers list refresh).
   * Side effects: Prompts for name/email/qty; POST /api/client/purchase; 
   *   shows user feedback; re-fetches events on success.
   */
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
        <main className="App" role="main">
          <h1>Clemson Tiger Tix</h1>
          <p>Loading events...</p>
        </main>
      );
    }

    if (error) {
      return (
        <main className="App" role="main">
          <h1 tabIndex="0">Clemson Campus Events</h1>
          <p className="error" role="alert">{error}</p>
        </main>
      );
    }

    return (
      <main className="App" role="main">
        <h1 tabIndex="0">Clemson Tiger Tix</h1>
        {message && (
          <div 
          className="message"
          role="status"
          aria-live="polite"
          tabIndex="0"
          >
            {message}
            </div>
        )}
        {events.length === 0 ? (
          <p>No events available at the moment.</p>
        ) : (
          <ul aria-label="List of campus events">
            {events.map((event) => (
              <li key={event.id} className="event-info">
                <article aria-labelledby={`event-${event.id}-title`}>
                  <h2 id={`event-${event.id}-title`} tabIndex="0">
                    {event.name}
                  </h2>
                  <p>
                    <time 
                    dateTime={event.date}
                    aria-label={`Event date: ${new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric', 
                    })}`}
                    tabIndex="0"
                    >
                      {event.date}
                    </time>
                  </p>
                  <p className="tickets-available" tabIndex="0">
                    {event.available_tickets} ticket(s) available
                  </p>
                <button 
                  onClick={() => buyTicket(event.id, event.name)}
                  disabled={event.available_tickets === 0}
                  className={event.available_tickets === 0 ? 'sold-out' : ''}
                  aria-label={
                    event.available_tickets === 0 ? `${event.name} is sold out` : `Buy ticket for ${event.name}`
                  }
                  >
                  {event.available_tickets === 0 ? 'Sold Out' : 'Buy Ticket'}
                  </button>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
      );
    }
export default App;
