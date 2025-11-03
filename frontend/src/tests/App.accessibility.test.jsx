/**
 * Purpose: Minimal a11y checks — aria-live transcript and accessible buttons.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

beforeEach(() => {
  window.speechSynthesis = { cancel: jest.fn(), speak: jest.fn(), getVoices: jest.fn(() => []) };
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/client/events')) {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    }
    if (url.includes('/api/llm/parse')) {
      return Promise.resolve(new Response(JSON.stringify({
        intent:'greeting', event_name:null, quantity:null, confidence:'high'
      }), { status: 200 }));
    }
    return Promise.resolve(new Response('[]', { status: 200 }));
  });
});

test('chat transcript has aria-live/role for announcements', async () => {
  render(<App />);
  // Find transcript container (role="log" with aria-live)
  const log = await screen.findByRole('log');
  expect(log).toBeInTheDocument();
});

test('send button has accessible name', async () => {
  render(<App />);
  expect(screen.getByRole('button', { name:/send/i })).toBeInTheDocument();
});