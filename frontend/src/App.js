/**
 * File: App.js
 * Brief: Split UI (events left, chat right). Supports typed chat + fully voice-driven flow.
 * Services: Client API (http://localhost:3002/api/client/*), LLM API (http://localhost:5002/api/llm/*).
 * Accessibility: ARIA roles/labels; aria-live for updates; keyboard focus on key text/actions.
 */

import React, { useEffect, useState } from 'react';
import './App.css';
import VoiceMic from './Components/VoiceMic';

/**
 * Purpose: Configure service base URLs for multi-service local dev.
 * Params: (process.env.REACT_APP_CLIENT_BASE, process.env.REACT_APP_LLM_BASE)
 * Returns/Side effects: None (constants used by fetch calls).
 */
const CLIENT_BASE = process.env.REACT_APP_CLIENT_BASE || 'http://localhost:3002';
const LLM_BASE    = process.env.REACT_APP_LLM_BASE    || 'http://localhost:5002';

/**
 * Purpose: Root React component rendering events (left) and chatbot (right).
 * Params: none
 * Returns/Side effects: JSX tree; triggers network requests via helper functions.
 */
function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const [chatOpen] = useState(true); 
  const [chatMsgs, setChatMsgs] = useState([
    { role: 'assistant', text: 'Hi! I can show events or help you book.' }
  ]);
  const [chatEvents, setChatEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

/**
 * fetchEvents
 * Purpose: Load event list for the left pane from the Client service.
 * Params: none
 * Returns/Side effects: Sets (events, loading, error); GET /api/client/events.
 */
  const fetchEvents = () => {
    fetch(`${CLIENT_BASE}/api/client/events`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch events');
        setLoading(false);
        console.error('Fetch error:', err);
      });
  };

/**
 * buyTicket
 * Purpose: Collect purchaser info and submit a purchase via Client service.
 * Params: (eventId: number, eventName: string)
 * Returns/Side effects: Prompts user; POST /api/client/purchase; sets success/error message; refreshes events.
 */
  const buyTicket = (eventId, eventName) => {
    const customerName = prompt('Enter your name:');
    if (!customerName) return alert('Name is required to buy a ticket.');
    const customerEmail = prompt('Enter your email:');
    if (!customerEmail) return alert('Email is required to buy a ticket.');
    const quantityStr = prompt('Enter number of tickets to buy:');
    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) return alert('Please enter a valid number of tickets.');

    fetch(`${CLIENT_BASE}/api/client/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        customer_name: customerName,
        customer_email: customerEmail,
        quantity
      })
    })
      .then((res) => res.ok ? res.json() : res.json().then(err => { throw new Error(err.error || 'Failed to purchase tickets'); }))
      .then(() => {
        setMessage(`Successfully purchased ${quantity} ticket(s) for ${eventName}`);
        setTimeout(() => setMessage(''), 3000);
        fetchEvents(); // refresh left pane
      })
      .catch((err) => {
        setMessage('Error purchasing tickets: ' + err.message);
        setTimeout(() => setMessage(''), 5000);
        console.error('Purchase error:', err);
      });
  };

/**
 * llmParse
 * Purpose: Send free-text to LLM /parse to extract intent and fields.
 * Params: (text: string)
 * Returns/Side effects: Resolves { intent, event_name, quantity, confidence }; throws on non-2xx.
 */
  const llmParse = async (text) => {
    const res = await fetch(`${LLM_BASE}/api/llm/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    if (!res.ok) throw new Error(`LLM parse failed: ${res.status}`);
    return res.json(); // { intent, event_name, quantity, confidence }
  };
/**
 * llmFetchEvents
 * Purpose: Get events (with availability) from LLM service for chat-side display.
 * Params: none
 * Returns/Side effects: Sets chatEvents; returns array; GET /api/llm/events.
 */
  const llmFetchEvents = async () => {
    const res = await fetch(`${LLM_BASE}/api/llm/events`);
    if (!res.ok) throw new Error(`LLM events failed: ${res.status}`);
    const data = await res.json();
    setChatEvents(data);
    return data;
  };

/**
 * llmConfirmBooking
 * Purpose: Persist a confirmed booking through the LLM endpoint.
 * Params: ({ event_id: number, customer_name: string, customer_email: string, quantity: number })
 * Returns/Side effects: Returns JSON summary; throws on error; POST /api/llm/confirm_booking; refresh is triggered by caller.
 */
  const llmConfirmBooking = async ({ event_id, customer_name, customer_email, quantity }) => {
    const res = await fetch(`${LLM_BASE}/api/llm/confirm_booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id, customer_name, customer_email, quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Booking failed');
    return data;
  };

/**
 * handleUserChat
 * Purpose: Append user's text to chat and route it to LLM parsing.
 * Params: (userText: string)
 * Returns/Side effects: Updates chatMsgs; on error, shows assistant error message.
 */
  const handleUserChat = async (userText) => {
    setChatMsgs((m) => [...m, { role: 'user', text: userText }]);
    try {
      const parsed = await llmParse(userText);
      await handleParsedIntent(parsed);
    } catch (e) {
      setChatMsgs((m) => [...m, { role: 'assistant', text: 'Sorry—LLM is unavailable.' }]);
    }
  };

  /**
 * handleParsedIntent
 * Purpose: Drive chat responses from LLM output (greeting/view_events/book).
 * Params: ({ intent: "greeting"|"view_events"|"book"|"unknown", event_name?: string|null, quantity?: number|null })
 * Returns/Side effects: Sends assistant replies; may propose booking; on booking success refreshes both panes.
 */
  const handleParsedIntent = async ({ intent, event_name, quantity }) => {
    if (intent === 'greeting') {
      setChatMsgs((m) => [...m, { role: 'assistant', text: 'Hello! Ask me to show events or to book.' }]);
      return;
    }
    if (intent === 'view_events') {
      const list = await llmFetchEvents();
      if (!list?.length) {
        setChatMsgs((m) => [...m, { role: 'assistant', text: 'No events with tickets available.' }]);
        return;
      }
      const names = list.map(e => `• ${e.name} (${new Date(e.date).toLocaleString()})`).join('\n');
      setChatMsgs((m) => [...m, { role: 'assistant', text: `Here are available events:\n${names}` }]);
      return;
    }
    if (intent === 'book') {
      const list = chatEvents.length ? chatEvents : await llmFetchEvents();
      const match = event_name
        ? list.find(e => e.name.toLowerCase() === event_name.toLowerCase())
          || list.find(e => e.name.toLowerCase().includes(event_name.toLowerCase()))
        : null;
      if (!match) {
        setChatMsgs((m) => [...m, { role: 'assistant', text: 'Which event would you like to book?' }]);
        return;
      }
      const customer_name = window.prompt(`Your name for "${match.name}"?`);
      const customer_email = window.prompt('Your email?');
      let qty = quantity && Number(quantity) > 0 ? Number(quantity) : null;
      if (!qty) qty = Number(window.prompt('How many tickets? (number)') || '0');
      if (!customer_name || !customer_email || !qty) {
        setChatMsgs((m) => [...m, { role: 'assistant', text: 'Booking canceled (missing info).' }]);
        return;
      }
      try {
        const ok = await llmConfirmBooking({
          event_id: match.id,
          customer_name,
          customer_email,
          quantity: qty
        });
        setChatMsgs((m) => [...m, { role: 'assistant', text: ok?.message || 'Booked!' }]);
        await llmFetchEvents(); //update right pane availability
        fetchEvents();      //update left pane availability
      } catch (err) {
        setChatMsgs((m) => [...m, { role: 'assistant', text: `Booking failed: ${err.message}` }]);
      }
      return;
    }
    setChatMsgs((m) => [...m, { role: 'assistant', text: 'I can show events or help you book.' }]);
  };

/**
 * Speech assistance (TTS)
 * Purpose: Provide simple text-to-speech for assistant replies.
 * Params: (browser SpeechSynthesis)
 * Returns/Side effects: Speaks assistant messages; cancels any in-progress speech first.
 */

/**
 * speak
 * Purpose: Read a string aloud using Speech Synthesis.
 * Params: (text: string)
 * Returns/Side effects: Cancels any current utterance; speaks with en-US, steady rate/pitch.
 */
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95; 
    u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) u.voice = voices.find(v => /english/i.test(v.name)) || voices[0];
    window.speechSynthesis.speak(u);
  }

/**
 * useEffect (announce assistant replies)
 * Purpose: Auto-speak the last assistant message when chat updates.
 * Params: (deps: [chatMsgs])
 * Returns/Side effects: Invokes speak() when the newest message is role='assistant'.
 */
  useEffect(() => {
    if (!chatMsgs.length) return;
    const last = chatMsgs[chatMsgs.length - 1];
    if (last.role === 'assistant' && last.text) speak(last.text);
 
  }, [chatMsgs]);

/**
 * Render (loading)
 * Purpose: Show app shell + loading state while fetching events.
 * Params: none
 * Returns/Side effects: Static JSX; no network calls.
 */
  if (loading) {
    return (
      <main className="App" role="main">
        <h1>Clemson Tiger Tix</h1>
        <p>Loading events...</p>
      </main>
    );
  }

/**
 * Render (error)
 * Purpose: Present an accessible error message if events fetch failed.
 * Params: none
 * Returns/Side effects: Static JSX with role="alert".
 */
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

      <div className="split">
        {/* LEFT: existing site */}
        <section className="left-pane">
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
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
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
                        event.available_tickets === 0
                          ? `${event.name} is sold out`
                          : `Buy ticket for ${event.name}`
                      }
                    >
                      {event.available_tickets === 0 ? 'Sold Out' : 'Buy Ticket'}
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>


        <aside className="right-pane" aria-label="Chat Assistant">
          {chatOpen && (
            <ChatWidget
              messages={chatMsgs}
              onSend={handleUserChat}
            />
          )}
        </aside>
      </div>
    </main>
  );
}

export default App;

/**
 * ChatWidget (presentational)
 * Purpose: Minimal chat UI — transcript log + input box + submit.
 * Params: ({ messages: Array<{role,text}>, onSend: (text)=>void })
 * Returns/Side effects: Renders messages (role-tagged); calls onSend on submit.
 */
function ChatWidget({ messages, onSend }) {
  const [input, setInput] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    onSend(t);
    setInput('');
  };
  return (
    <section className="chat-panel" aria-label="TigerTix Chat Assistant">
      <header className="chat-header">Assistant</header>
      <div className="chat-body" role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`} tabIndex="0">
            <span className="chat-role">{m.role === 'assistant' ? 'Assistant' : 'You'}:</span>
            <span className="chat-text">{m.text}</span>
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={submit} style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask to show events or book tickets…"
          aria-label="Type a message"
          style={{ flex: 1 }}
        />
        <VoiceMic onSend={onSend} />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}