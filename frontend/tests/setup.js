// Test setup file
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window events
window.dispatchEvent = vi.fn();
window.addEventListener = vi.fn();
window.removeEventListener = vi.fn();

// Mock console.error for expected errors
const originalConsoleError = console.error;
beforeEach(() => {
  vi.clearAllMocks();
});

// Reset localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
