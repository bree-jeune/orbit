import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { initializeServiceWorker } from './services/serviceWorker';


const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);

// Register service worker for PWA support (Disabled for Extension)
if (
  process.env.NODE_ENV === "production" &&
  "serviceWorker" in navigator &&
  window.location.protocol !== "chrome-extension:" &&
  window.location.hostname !== "localhost"
) {
  initializeServiceWorker();
} else if ("serviceWorker" in navigator) {
  // Explicitly unregister if in extension or dev mode to avoid cache errors
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

