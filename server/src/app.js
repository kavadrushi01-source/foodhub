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
//   - a resolved-but-now-disconnected connection also clears bootPromise, so a
//     dropped Atlas connection can self-heal instead of pinning the instance
//     into a permanent 503 (see the 'disconnected' listener below).
let bootPromise = null;

// Cold-start retry budget. Vercel keeps an instance alive only while it is
// being used, so a short backoff window is enough to ride out a flaky Atlas or
// DNS handshake without paying for a permanently warm instance.
const MAX_BOOT_RETRIES = 4;
const BOOT_RETRY_BASE_MS = 1000;
const MAX_BOOT_RETRY_DELAY_MS = 8000;
let bootRetries = 0;

// If Mongo has dropped (readyState !== 1) but bootPromise is still holding an
// already-resolved value, that promise is stale: awaiting it resolves instantly
// and would make every later request fail with 503 forever, because ensureBoot
// sees a non-null bootPromise and never reconnects. Clear it so the next call
// actually retries the connection.
const invalidateStaleBoot = () => {
  if (bootPromise && mongoose.connection.readyState !== 1) {
    bootPromise = null;
  }
};

const ensureBoot = () => {
  invalidateStaleBoot();
  if (!bootPromise) {
    initSentry();
    bootPromise = connectDB()
      .then(() => {
        logger.info('Db connected');
        seedIfEmpty()
          .then(() => logger.info('Seed sync done (background)'))
          .catch((e) => logger.warn(`Seed sync deferred: ${e.message}`));
      })
      .catch((err) => {
        // Retry with backoff instead of giving up. Atlas/DNS handshakes fail
        // intermittently on a fresh Vercel instance, and a single transient
        // failure would otherwise leave the instance answering 503 until
        // Vercel recycles it.
        bootRetries += 1;
        bootPromise = null;
        if (bootRetries > MAX_BOOT_RETRIES) {
          logger.error(`DB/seed bootstrap failed ${bootRetries} times, giving up until next request: ${err.message}`);
          return undefined;
        }
        const delay = Math.min(BOOT_RETRY_BASE_MS * bootRetries, MAX_BOOT_RETRY_DELAY_MS);
        logger.warn(`DB bootstrap attempt ${bootRetries} failed (${err.message}); retrying in ${delay}ms`);
        setTimeout(() => {
          ensureBoot(); // fire-and-forget: the next request also awaits this
        }, delay);
        return undefined;
      })
      .then(() => {
        // Reset the retry counter once we actually reach a good state, so a
        // later cold start gets the full number of attempts again.
        if (mongoose.connection.readyState === 1) bootRetries = 0;
      });
  }
  return bootPromise;
};
ensureBoot();

// Atlas can drop an idle connection on a warm instance. Without this, bootPromise
// stays resolved-but-useless and the instance 503s until Vercel recycles it.
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected — bootstrap will re-run on the next request');
  invalidateStaleBoot();
});

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
      const allowed = config.clientUrlList.map(normalize).filter(Boolean);
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
const dbReady = async (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();

  // Poll instead of awaiting a single attempt: ensureBoot resolves immediately
  // when it schedules a retry, so awaiting it once would resolve before the
  // retried connection has had a chance to succeed.
  const deadline = Date.now() + 30000;
  while (mongoose.connection.readyState !== 1 && Date.now() < deadline) {
    ensureBoot(); // no-op while a boot is in flight; restarts one otherwise
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (mongoose.connection.readyState === 1) return next();

  return res.status(503).json({
    success: false, status: 503, code: 'DB_NOT_READY',
    message: 'Server is waking up — please retry in a few seconds.',
    ...(getDBError() ? { data: { db: getDBError() } } : {}),
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
