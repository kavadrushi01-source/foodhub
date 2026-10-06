import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.jsx';
import './index.css';

// Client-side error tracking (no-op when VITE_SENTRY_DSN is not set).
// Loaded via dynamic import so the Sentry SDK never blocks first paint —
// when no DSN is configured the chunk is never even fetched, and when it
// is, it arrives after the app has already rendered.
const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.2,
    });
  }).catch(() => { /* monitoring must never break the app */ });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
);
