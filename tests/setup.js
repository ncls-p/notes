import '@testing-library/jest-dom'

// Mock of window.fetch
global.fetch = vi.fn();

// Mock of window location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

// Setup to silence console errors during tests
console.error = vi.fn();
console.warn = vi.fn();