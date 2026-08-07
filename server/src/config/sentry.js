import * as Sentry from '@sentry/node';
import config from './index.js';

/**
 * Initialize Sentry error tracking when a DSN is configured.
 * Safe no-op when SENTRY_DSN is empty (e.g. local dev / CI).
 */
export const initSentry = () => {
  if (!config.sentry.dsn) {
    return;
  }
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.env,
    tracesSampleRate: 1.0,
  });
};

export default Sentry;
