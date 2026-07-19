import { getAnalytics, logEvent as fbLogEvent, isSupported } from 'firebase/analytics';
import { initializeApp, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'mock-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mock-domain',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'mock-db-url',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mock-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mock-storage-bucket',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'mock-sender-id',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'mock-app-id',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'mock-measurement-id'
};

let analytics = null;

isSupported().then(supported => {
  if (supported) {
    try {
      let app;
      try {
        app = getApp();
      } catch (e) {
        app = initializeApp(firebaseConfig);
      }
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Failed to initialize Firebase Analytics:', error);
    }
  }
});

export function logCustomEvent(name, params = {}) {
  console.log(`[Analytics Event Logged] ${name}`, params);
  if (analytics) {
    try {
      fbLogEvent(analytics, name, params);
    } catch (error) {
      console.error(`Firebase Analytics failed to log event ${name}:`, error);
    }
  }
}
