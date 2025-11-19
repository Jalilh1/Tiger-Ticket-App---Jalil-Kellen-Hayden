/**
 * Purpose: Test VoiceMic accessibility & basic recording state.
 * Uses mocks for Web Speech + Web Audio from setupTests.js.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceMic from '../Components/VoiceMic';

test('VoiceMic toggles recording state and shows "Listening…" hint', async () => {
    const onSend = jest.fn();

    render(<VoiceMic onSend={onSend} />);

    const button = screen.getByRole('button', { name: /start voice input/i });

    // Initially not recording
    expect(button).toHaveAttribute('aria-pressed', 'false');

    // Click to start recording
    await userEvent.click(button);

    // aria-pressed updated
    expect(button).toHaveAttribute('aria-pressed', 'true');

    // Announce listening
    const status = await screen.findByText(/listening…/i);
    expect(status).toBeInTheDocument();
});