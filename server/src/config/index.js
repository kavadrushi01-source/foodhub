import dotenv from 'dotenv';

dotenv.config();

const bool = (v, def = false) => {
  if (v === undefined) return def;
  return v === 'true' || v === '1' || v === 'yes';
};

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

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`,

  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'FoodHub <no-reply@foodhub.local>',
  },

  oauth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/google/callback`,
    },
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
