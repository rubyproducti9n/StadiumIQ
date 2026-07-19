import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage for test environment consistency
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; },
    key: (index) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock import.meta.env variables for vitest
vi.stubEnv('VITE_GEMINI_API_KEY', 'mock_api_key');
vi.stubEnv('VITE_FIREBASE_API_KEY', 'mock_firebase_api_key');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'stadiumiq-6ceba.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'stadiumiq-6ceba');
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'stadiumiq-6ceba.firebasestorage.app');
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '6610294420');
vi.stubEnv('VITE_FIREBASE_APP_ID', '1:6610294420:web:229c5d66da6ff62fab4681');
vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-1002LJMDKP');
