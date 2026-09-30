import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import passport from './config/oauth.js';

import mongoose from 'mongoose';
import config from './config/index.js';
import logger from './config/logger.js';
import Sentry, { initSentry } from './config/sentry.js';
import { connectDB, getDBError } from './config/database.js';
import { seedIfEmpty } from './utils/seeder.js';

import authRoutes from './routes/authRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';

import { errorHandler, notFound } from './middlewares/error.js';

// ============ BOOTSTRAP (module scope = once per warm instance) ============
// This file doubles as the Vercel serverless entry (zero-config Express
// accepts app.js / index.js / server.js), so all startup happens here rather
// than in server.js:
//   - Sentry init (no-op without SENTRY_DSN)
//   - MongoDB connect + idempotent seed in the background (routes are gated
//     by dbReady below, so /health answers instantly during a cold start)
//   - a failed attempt clears bootPromise, so the next request retries
let bootPromise = null;
const ensureBoot = () => {
  if (!bootPromise) {
    initSentry();
    bootPromise = connectDB()
      .then(() => seedIfEmpty())
      .then(() => logger.info('✅ Bootstrap complete: DB connected, seed synced'))
      .catch((err) => {
        bootPromise = null;
        logger.error('DB/seed bootstrap failed (will retry on next request):', err.message);
      });
  }
  return bootPromise;
};
ensureBoot();

const app = express();

// Render/Vercel sit behind proxies — needed for Secure cookies + correct IPs
app.set('trust proxy', 1);

// Sentry request metadata is handled by Sentry.init() + the SDK's own
// request middleware in @sentry/node v8+ (the legacy Sentry.Handlers API
// was removed and throws if referenced — keep this block empty).

// ============ SECURITY MIDDLEWARE ============
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / non-browser requests (no Origin header)
      if (!origin) return callback(null, true);
      const normalize = (v) => {
        let s = String(v || '').trim();
        while (s.endsWith('/')) s = s.slice(0, -1);
        return s;
      };
      const allowed = String(config.clientUrl || '')
        .split(',')
        .map((s) => normalize(s))
        .filter(Boolean);
      // Always allow local dev origins too
      allowed.push('http://localhost:5173', 'http://127.0.0.1:5173');
      if (allowed.includes(normalize(origin))) return callback(null, true);
      // In dev, allow any localhost port
      if (!config.isProd) {
        let hostOk = false;
        try {
          const u = new URL(normalize(origin));
          hostOk = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
        } catch {
          hostOk = false;
        }
        if (hostOk) return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
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
// NOTE: these must answer even when MongoDB is down — the host's health
// checks use them to decide if the service is alive. DB-backed routes will
// 503 with a clear message until the connection is ready (see dbReady below).
app.get('/', (_req, res) => {
  res.status(200).json({ success: true, status: 200, message: 'FoodHub API is running', data: { service: 'foodhub-api', env: config.env, docs: '/api/foods', health: '/health', time: new Date().toISOString() } });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 200, message: 'OK', data: { service: 'foodhub-api', env: config.env, time: new Date().toISOString() } });
});

// Readiness probe: tells the frontend whether the DB is up yet.
app.get('/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    success: ready, status: ready ? 200 : 503,
    message: ready ? 'ready' : 'database connecting — please retry in a few seconds',
    ...(ready ? {} : { data: { db: getDBError() } }),
  });
});

// Gate DB-backed routes: return a clear 503 instead of hanging when Atlas
// is still connecting (cold start) instead of mysterious "Network error".
const dbReady = (_req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  ensureBoot(); // retry a previously failed bootstrap (self-healing)
  return res.status(503).json({
    success: false, status: 503, code: 'DB_NOT_READY',
    message: 'Server is waking up — please retry in a few seconds.',
  });
};

// ============ ROUTES ============
// Chatbot answers from a local knowledge engine (no DB) — keep public + ungated.
app.use('/api/chatbot', chatbotRoutes);
// All data routes need MongoDB — gate them so cold starts return a clear
// 503 ("waking up") instead of hanging until the client times out.
app.use('/api/auth', authLimiter, dbReady, authRoutes);
app.use('/api', dbReady, foodRoutes);          // /api/foods, /api/categories, /api/reviews, /api/wishlist, /api/addresses
app.use('/api/orders', dbReady, orderRoutes);
app.use('/api/admin', dbReady, adminRoutes);
app.use('/api/delivery', dbReady, deliveryRoutes);
app.use('/api/payments', dbReady, paymentRoutes);

// ============ ERROR HANDLING ============
app.use(notFound);
// Sentry must capture errors BEFORE our errorHandler responds (its handler
// records the error then calls next(error) to pass it down the chain).
// Uses the @sentry/node v8+ API — Sentry.Handlers was removed in v8 and
// throws a TypeError at module load when SENTRY_DSN is set (no-op without DSN).
if (config.sentry.dsn) {
  Sentry.setupExpressErrorHandler(app);
}
app.use(errorHandler);

export default app;
