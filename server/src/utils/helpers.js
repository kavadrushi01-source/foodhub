import config from '../config/index.js';

/**
 * Short-lived in-memory cache for PUBLIC read-only endpoints, plus
 * `Cache-Control` so the browser and Vercel edge stop re-fetching them on every
 * navigation.
 *
 * Why: the API runs in Vercel (US-East) while Atlas sits in another region, so
 * every query costs a cross-region round trip (~400-500ms on top of a ~250ms
 * cold-start). The catalogue (foods, categories, featured) changes only when an
 * admin edits it, so a few seconds of staleness is invisible and removes the
 * wait from repeat visits and hard refreshes.
 *
 * Only ever applied to public GET routes — never to anything personalised.
 */
const store = new Map();

// Cap the cache so a long-lived instance can't grow without bound if the app
// gains many distinct query strings.
const MAX_ENTRIES = 200;

const prune = () => {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expires <= now) store.delete(key);
  }
  // Still oversized (all fresh) — drop the oldest entries.
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
};

/**
 * @param {number} ttl      cache lifetime in ms
 * @param {number} maxAge   `s-maxage`/`max-age` for shared + browser caches (0 = don't cache downstream)
 */
export const cachePublic = (ttl = 30000, maxAge = 30) => async (req, res, next) => {
  // Bail on anything but a plain GET (defensive: this must never serve a
  // personalised or mutating response from cache).
  if (req.method !== 'GET') return next();

  // Vary on the full query string so /api/foods?sort=rating and ?sort=price
  // never collide.
  const key = req.originalUrl;
  const now = Date.now();
  const hit = store.get(key);

  if (hit && hit.expires > now) {
    res.set('X-Cache', 'HIT');
    return res.status(200).json(hit.body);
  }

  if (maxAge > 0) {
    // `s-maxage` lets the Vercel edge serve repeat visitors without even
    // invoking this function; `must-revalidate` stops stale data sticking
    // around when an admin edits the catalogue.
    res.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=60, must-revalidate`);
  } else {
    res.set('Cache-Control', 'no-store');
  }

  // Intercept the response to snapshot it once the handler has produced JSON.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success) {
      store.set(key, { body, expires: now + ttl });
      prune();
    } else {
      // Errors must never be cached downstream: a transient 404/500 would
      // otherwise be pinned at the edge for the whole `maxAge` window and keep
      // failing for every visitor until it expired.
      res.set('Cache-Control', 'no-store');
    }
    return originalJson(body);
  };

  return next();
};

/**
 * Currency helper. Uses currency symbol from config.
 */
export const formatCurrency = (amount) => {
  const value = Number(amount || 0).toFixed(2);
  return `${config.payments.currencySymbol}${value}`;
};

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Paginate a Mongoose query using page/limit.
 * Returns the page of documents plus pagination meta.
 *
 * NOTE: `countDocuments()` honours the query's own `limit`/`skip`. The count
 * query is therefore cloned BEFORE those modifiers are applied — cloning after
 * `.limit(l)` silently capped `total` at the page size (and pinned
 * `totalPages` to 1), which made every page but the first unreachable.
 */
export const paginate = async (queryBuilder, { page = 1, limit = 12 } = {}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (p - 1) * l;

  // Build BOTH queries before awaiting: `clone()` must happen while the builder
  // still has no limit/skip, and both can then run in parallel (the two round
  // trips overlap, which matters for cross-region Atlas latency).
  const countQuery = queryBuilder.clone().countDocuments();
  const itemsQuery = queryBuilder.skip(skip).limit(l).exec();
  const [total, items] = await Promise.all([countQuery, itemsQuery]);

  return {
    items,
    meta: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l) || 0,
      hasNext: p * l < total,
      hasPrev: p > 1,
    },
  };
};

export default { formatCurrency, round2, paginate, cachePublic };
