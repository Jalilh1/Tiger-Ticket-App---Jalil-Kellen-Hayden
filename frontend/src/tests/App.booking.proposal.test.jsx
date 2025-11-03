/**
 * Purpose: Ensure "book" intent yields proposal (no auto booking).
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
        intent:'book', event_name:'Campus Concert', quantity:2, confidence:'high'
      }), { status: 200 }));
    }
    if (url.includes('/api/llm/events')) {
      return Promise.resolve(new Response(JSON.stringify([
        { id:1, name:'Campus Concert', date:'2025-12-01', available_tickets: 5 }
      ]), { status: 200 }));
    }
    if (url.includes('/api/llm/confirm_booking')) {
      // Should NOT be called automatically in this test;
      // if it is, this helps detect it:
      return Promise.resolve(new Response(JSON.stringify({}), { status: 500 }));
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
});

test('book intent produces proposal only (no auto purchase)', async () => {
  render(<App />);
  await screen.findAllByRole('article');

  await userEvent.type(screen.getByLabelText(/type a message/i), 'book two tickets for campus concert');
  await userEvent.click(screen.getByRole('button', { name: /send/i }));

  // Proposal appears
  expect(await screen.findByText(/I can reserve 2 ticket/i)).toBeInTheDocument();
});