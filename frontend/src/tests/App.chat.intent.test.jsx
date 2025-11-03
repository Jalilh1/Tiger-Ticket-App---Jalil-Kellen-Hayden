/**
 * Purpose: Verify chat "show events" → parse → assistant reply + TTS.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

beforeEach(() => {
  window.speechSynthesis = { cancel: jest.fn(), speak: jest.fn(), getVoices: jest.fn(() => []) };
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/client/events')) {
      return Promise.resolve(new Response(JSON.stringify([
        { id:2, name:'Clemson Football Game', date:'2025-11-20', available_tickets: 10 }
      ]), { status: 200 }));
    }
    if (url.includes('/api/llm/parse')) {
      return Promise.resolve(new Response(JSON.stringify({
        intent:'view_events', event_name:null, quantity:null, confidence:'high'
      }), { status: 200 }));
    }
    if (url.includes('/api/llm/events')) {
      return Promise.resolve(new Response(JSON.stringify([
        { id:1, name:'Campus Concert', date: new Date().toISOString(), available_tickets: 5 }
      ]), { status: 200 }));
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
});

test('typing "show events" displays assistant list and triggers TTS', async () => {
  render(<App />);

  // Wait left pane to render at least one event article
  expect(await screen.findAllByRole('article')).toHaveLength(1);

  // Send message
  await userEvent.type(screen.getByLabelText(/type a message/i), 'show events');
  await userEvent.click(screen.getByRole('button', { name: /send/i }));

  // Assistant lists events
  expect(await screen.findByText(/Here are available events/i)).toBeInTheDocument();
  expect(window.speechSynthesis.speak).toHaveBeenCalled();
});