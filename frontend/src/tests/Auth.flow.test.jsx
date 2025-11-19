/**
 * Purpose: Verify authentication flow in the React app:
 * - Unauthenticated users see login/register screen.
 * - Successful login moves user into the TigerTix app shell.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

beforeEach(() => {
    // Clear any existing token between tests
    localStorage.clear();

    // Mock fetch for:
    // - /api/client/events (called once user is logged in)
    // - /api/auth/login
    global.fetch = jest.fn((url, options) => {
        if (url.includes('/api/client/events')) {
            return Promise.resolve(
                new Response(JSON.stringify([
                    { id: 1, name: 'Clemson Football Game', date: '2025-09-01', available_tickets: 15000 }
                ]), { status: 200 })
            );
        }

        if (url.includes('/api/auth/login')) {
            // basic success payload expected by authContext
            return Promise.resolve(
                new Response(JSON.stringify({
                    token: 'fake-jwt-token',
                    user: { id: 1, email: 'student@clemson.edu', name: 'Student' }
                }), { status: 200 })
            );
        }

        if (url.includes('/api/auth/me')) {
            return Promise.resolve(
                new Response(JSON.stringify({
                    id: 1,
                    email: 'student@clemson.edu',
                    name: 'Student'
                }), { status: 200 })
            );
        }

        // default fallback
        return Promise.resolve(new Response('[]', { status: 200 }));
    });

    // speechSynthesis mocks as in other tests
    window.speechSynthesis = {
        cancel: jest.fn(),
        speak: jest.fn(),
        getVoices: jest.fn(() => [])
    };
});

test('unauthenticated users see login form, then app after successful login', async () => {
    render(<App />);

    // Initially we should see login form
    expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument();

    // Fill and submit login form
    await userEvent.type(screen.getByLabelText(/email/i), 'student@clemson.edu');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // After successful login, the app shell should render
    await waitFor(async () => {
        expect(await screen.findByText(/tigerTix/i)).toBeInTheDocument();
    });

    // And events pane should load at least one event
    const articles = await screen.findAllByRole('article');
    expect(articles.length).toBeGreaterThan(0);
});