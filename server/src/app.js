import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import passport from './config/oauth.js';

import config from './config/index.js';
import logger from './config/logger.js';
import Sentry from './config/sentry.js';

import authRoutes from './routes/authRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

import { errorHandler, notFound } from './middlewares/error.js';

const app = express();

// Sentry request tracking (no-op when no DSN configured)
if (config.sentry.dsn) {
  app.use(Sentry.Handlers.requestHandler());
}

// ============ SECURITY MIDDLEWARE ============
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: config.isProd ? config.clientUrl : /http:\/\/localhost:\d+/,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strip $ and . from keys to prevent NoSQL injection
app.use(compression());
app.use(passport.initialize());

// HTTP request logging
app.use(
  morgan(config.isProd ? 'combined' : 'dev', {
    skip: (req) => req.originalUrl.startsWith('/health'),
  }),
);

// Global rate limiter
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: 429,
    code: 'RATE_LIMITED',
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api', limiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 429, code: 'RATE_LIMITED', message: 'Too many auth attempts.' },
});

// ============ ROOT / HEALTH CHECK ============
app.get('/', (_req, res) => {
  res.status(200).json({ success: true, status: 200, message: 'FoodHub API is running', data: { service: 'foodhub-api', env: config.env, docs: '/api/foods', health: '/health', time: new Date().toISOString() } });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 200, message: 'OK', data: { service: 'foodhub-api', env: config.env, time: new Date().toISOString() } });
});

// ============ ROUTES ============
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', foodRoutes);          // /api/foods, /api/categories, /api/reviews, /api/wishlist, /api/addresses
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments', paymentRoutes);

// ============ ERROR HANDLING ============
app.use(notFound);
app.use(errorHandler);
// Sentry error reporting must be the outermost error middleware (no-op when no DSN)
if (config.sentry.dsn) {
  app.use(Sentry.Handlers.errorHandler());
}

export default app;
