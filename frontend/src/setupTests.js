// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom

// Testing Library matchers
import '@testing-library/jest-dom';

// --- Mocks for Web Speech API (TTS) ---
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = 'en-US';
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  }
}
global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

Object.defineProperty(window, 'speechSynthesis', {
  value: {
    cancel: jest.fn(),
    speak: jest.fn(),
    getVoices: jest.fn(() => []),
    paused: false,
    pending: false,
    speaking: false,
    pause: jest.fn(),
    resume: jest.fn()
  },
  writable: true
});

// (Optional) Mock AudioContext if your code plays a beep
if (!window.AudioContext) {
  window.AudioContext = jest.fn().mockImplementation(() => ({
    createOscillator: () => ({
      type: 'sine',
      frequency: { setValueAtTime: jest.fn() },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    }),
    createGain: () => ({
      gain: { setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
      connect: jest.fn()
    }),
    destination: {},
    currentTime: 0,
    resume: jest.fn(),
    close: jest.fn()
  }));
}