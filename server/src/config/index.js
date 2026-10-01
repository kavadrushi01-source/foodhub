import dotenv from 'dotenv';

dotenv.config();

const bool = (v, def = false) => {
  if (v === undefined) return def;
  return v === 'true' || v === '1' || v === 'yes';
};

/**
 * CLIENT_URL is a comma-separated allow-list (frontend + local dev). Building a
 * redirect/link from the raw value would produce garbage like
 * "https://a.app,https://b.app/oauth-callback", so anything that needs ONE
 * absolute URL must go through this helper.
 */
const firstUrl = (value, fallback) => {
  const first = String(value || '')
    .split(',')[0]
    .trim();
  return first || fallback;
};

const stripTrailingSlash = (v) => String(v || '').trim().replace(/\/+$/, '');

const clientUrlList = String(process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => stripTrailingSlash(s))
  .filter(Boolean);

const apiUrl = stripTrailingSlash(process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  isProd: (process.env.NODE_ENV || 'development') === 'production',

  db: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodhub',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cookie: {
    secure: bool(process.env.COOKIE_SECURE, false),
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
  },

  // Comma-separated allow-list of browser origins (CORS + cookie decisions).
  clientUrlList,
  // The ONE canonical frontend origin. Use this for redirects and links.
  clientUrl: firstUrl(process.env.CLIENT_URL, 'http://localhost:5173'),
  apiUrl,

  oauth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      // Explicit override wins; otherwise derive from the live API origin.
      // This MUST exactly match an "Authorized redirect URI" in the Google
      // Cloud console, otherwise Google rejects the request with
      // `redirect_uri_mismatch` (HTTP 400).
      callbackURL:
        stripTrailingSlash(process.env.GOOGLE_CALLBACK_URL) ||
        `${apiUrl}/api/auth/google/callback`,
    },
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'FoodHub <no-reply@foodhub.local>',
  },

  payments: {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    currency: process.env.CURRENCY || 'INR',
    currencySymbol: process.env.CURRENCY_SYMBOL || '?',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    env: process.env.NODE_ENV || 'development',
  },
};

export default config;
