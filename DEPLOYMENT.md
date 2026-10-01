# FoodHub — Deployment & Changelog

Everything you need to know about **where the site is live**, **what we changed**, and
**what still needs doing**. Single source of truth for deployment.

---

## 🌐 Where the Website Is Live

| What | URL |
|------|-----|
| **Website (frontend)** | <https://foodhub-seven-gules.vercel.app> |
| **API (backend)** | <https://foodhub-pearl-tau.vercel.app> |
| **API health check** | <https://foodhub-pearl-tau.vercel.app/health> |
| **Readiness probe** | <https://foodhub-pearl-tau.vercel.app/ready> |
| **Source repository** | <https://github.com/kavadrushi01-source/foodhub> |

Both projects run on **Vercel (free tier)**. The API is a **serverless function**.

### Architecture

```
Browser
  ▼
React SPA  (foodhub-seven-gules.vercel.app)
  │  same-origin /api  ←  no CORS, no cross-site cookies
  ▼
Vercel rewrite  (client/vercel.json)
  │  /api/*  →  https://foodhub-pearl-tau.vercel.app/api/*
  ▼
Express API  (foodhub-pearl-tau.vercel.app)
  ▼
MongoDB Atlas
```

The client calls the API **same-origin on purpose**. This removes CORS, avoids
cross-site cookie/SameSite problems, and means a stale `VITE_API_URL` baked into a
build can never break the app.

### Google OAuth — the one manual setting

The callback URI **must** be registered in Google Cloud Console. This is the only
part that cannot be automated from code.

| Setting | Value |
|---------|-------|
| OAuth Client ID | `967681167974-od7ch8nsm0bp1v6tajpv59sdsi7m97lb.apps.googleusercontent.com` |
| Project | FoodHub → Google Auth Platform → Clients → FoodHub Web |
| **Authorized redirect URI** | `https://foodhub-pearl-tau.vercel.app/api/auth/google/callback` |
| Authorized JavaScript origins | `http://localhost:5173`, `https://foodhub-seven-gules.vercel.app` |

> ⚠️ **Common mistake:** the callback path must go in **Authorized redirect URIs**,
> *not* **Authorized JavaScript origins**. Origins reject paths
> (`Invalid Origin: URIs must not contain a path`) — different field entirely.

Confirm the app sends the right URI at any time:

```bash
curl https://foodhub-pearl-tau.vercel.app/api/auth/providers
# → { "google": true, "callbackUrl": "https://foodhub-pearl-tau.vercel.app/api/auth/google/callback" }
```

---

## 📋 Environment Variables

### API (`foodhub-pearl-tau.vercel.app`)

| Variable | Value |
|----------|-------|
| `API_URL` | `https://foodhub-pearl-tau.vercel.app` |
| `CLIENT_URL` | `https://foodhub-seven-gules.vercel.app` |
| `GOOGLE_CALLBACK_URL` | `https://foodhub-pearl-tau.vercel.app/api/auth/google/callback` |
| `MONGODB_URI` | *Atlas connection string (secret)* |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | *secrets* |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | *Google OAuth* |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | **Test keys only** — see below |

### 💳 Razorpay — TEST MODE ONLY

This project runs Razorpay in **test mode only**. Live keys are **actively refused**
by the server, so a production key can never charge a real card.

| Key prefix | Behaviour |
|---|---|
| `rzp_test_…` | ✅ Allowed — online payments work |
| `rzp_live_…` | ❌ **Always blocked** — logged as blocked, online payments stay off |
| anything else | ❌ Treated as unknown — online payments stay off |
| missing / partial pair | ❌ Online payments stay off (COD still works) |

**Where to get test keys:** <https://dashboard.razorpay.com/app/keys> — switch the
dashboard to **Test Mode** (toggle, top-right) and copy the `rzp_test_…` key id and
secret. Test cards/payments never move real money.

The mode is derived from the key prefix, and **both the id and the secret are
checked** — a live secret pasted next to a test-looking id is still caught.

Check the live state at any time (requires auth):

```bash
GET /api/payments/config
# {
#   "razorpayConfigured": true,
#   "razorpayMode": "test",          // test | live | unknown | none
#   "razorpayLiveBlocked": false,    // true => a live key was refused
#   "methods": ["cod", "upi", "razorpay"]
# }
```

> ⚠️ If you deploy a live key, `razorpayMode` becomes `"live"` and
> `razorpayLiveBlocked` becomes `true`. Online payments turn off (COD keeps
> working) and the server logs a clear warning. Replace it with an `rzp_test_…`
> key to re-enable them.

| `RESEND_API_KEY` | *transactional email* |

`CLIENT_URL` accepts a comma-separated list — the **full list** is used for CORS and
the **first entry** is the canonical frontend origin for redirects and email links.

### Frontend (`foodhub-seven-gules.vercel.app`)

No API URL needed — the rewrite handles routing. Keep `VITE_USE_DIRECT_API` unset so
requests stay same-origin.

---

## ✅ What We Changed

### 1. Google OAuth — `redirect_uri_mismatch` fixed

**Symptom:** *Sign in with Google* showed
`Error 400: redirect_uri_mismatch — This app's request is invalid`.

**Root causes** (three, layered):

1. `API_URL` pointed at `foodhub-api.vercel.app` — an unreachable host owned by a
   different Vercel team, so the URI sent to Google was wrong.
2. `GOOGLE_CALLBACK_URL` was never set explicitly, so the callback was derived from
   that same stale `API_URL`.
3. The URI was **not registered in the Google console at all**. We proved this by
   decoding Google's base64-encoded `authError` token: every candidate URI —
   including bare origins with no path — returned `redirect_uri_mismatch`, meaning
   the authorized list was empty.

**Changes**

| File | Change |
|------|--------|
| `server/src/config/index.js` | Parse `CLIENT_URL` as a comma-separated list — full list for CORS, first entry as canonical origin for redirects/emails |
| `server/src/config/oauth.js` | Added `GOOGLE_CALLBACK_URL` override |
| `server/src/controllers/oauthController.js` | Better failure redirects; expose effective callback via `/api/auth/providers`; clear handling for an unconfigured provider |
| `server/src/controllers/authController.js` | Handle unconfigured-provider case |
| `server/src/routes/authRoutes.js` | Per-route protection (see #3) |
| `server/src/utils/cookie.js` | Unified cookie options between login and refresh rotation |
| `server/.env.example` | Documented `GOOGLE_CALLBACK_URL` |

**Manual step required:** register the callback URI in the Google Cloud console
(table above). Code alone cannot fix this.

### 2. Cold-start reliability (503 "Server is waking up")

**Symptom:** the first request after an idle period returned `503 DB_NOT_READY`,
and occasionally an instance stayed broken.

**Root causes**

- `bootPromise` was **never cleared on disconnect**. Once Atlas dropped a
  connection on a warm instance, `ensureBoot()` returned an already-resolved
  promise forever — a **permanent 503 until Vercel recycled the instance**.
- A single transient Atlas/DNS failure aborted the whole boot with no retry.
- `dbReady` awaited one attempt via `Promise.race`, but `ensureBoot` resolves
  *immediately* when it schedules a retry, so the retry never got time to work.

**Changes** (`server/src/app.js`)

- `invalidateStaleBoot()` clears a resolved-but-useless `bootPromise` when
  `readyState !== 1`.
- A `mongoose.connection.on('disconnected')` listener triggers self-heal.
- Boot retries with exponential backoff (4 attempts, 1s→8s).
- `dbReady` now **polls** `readyState` until ready or the 30s deadline, instead of
  awaiting a single attempt.

### 3. Unknown routes returned 401 instead of 404

`router.use(protect)` also ran for **unmatched** paths, so any typo'd URL (e.g.
`/api/banners`) hit the auth middleware and returned 401. Replaced with
**per-route protection** in `server/src/routes/foodRoutes.js`.

### 4. Performance — 14× faster catalogue loads

The API runs in Vercel (US-East) while MongoDB Atlas is in another region, so every
query paid a cross-region round trip. Measured live (6 runs each):

| Endpoint | Before (avg) | After (avg) | Speedup |
|---|---|---|---|
| `/api/foods` | 724ms | **51ms** | **14×** |
| `/api/categories` | 642ms | **69ms** | **9×** |
| `/api/featured` | 733ms | **99ms** | **7×** |
| `/health` (no DB) | 329ms | — | baseline |

**Changes**

- `server/src/utils/helpers.js` — new `cachePublic(ttl, maxAge)` middleware: short
  in-memory TTL cache plus `Cache-Control` (`s-maxage`,
  `stale-while-revalidate`, `must-revalidate`). Keyed on `req.originalUrl` so
  different query strings never collide; capped at 200 entries; **non-200 responses
  are never cached** (`no-store`) so a transient 4xx/5xx can't get pinned at the edge.
- `server/src/routes/foodRoutes.js` — applied to public catalogue GETs only
  (`/featured`, `/categories`, `/foods`, `/foods/:slug`, `/reviews/:foodId`). Never
  applied to personalised or authenticated routes.
- `client/src/api/axios.js` — retries transient network failures
  (`ECONNRESET`/`ETIMEDOUT`/`EPIPE`, 2×) and `503 DB_NOT_READY` (3×). Safe because
  no response status means the request never reached a handler.

### 5. Duplicate requests on every page load

`client/src/pages/Home.jsx` armed a retry timer **unconditionally** — including after
a *successful* load — firing a duplicate pair of requests 5 seconds after every
successful visit. Now retries only when the load genuinely failed.

### 7. Razorpay forced to TEST MODE (live keys removed)

**Requirement:** use Razorpay in test mode only and remove real/live API usage.

**Findings**

- Local `server/.env` had **empty** keys (never contained real keys).
- **No real key values were ever committed.** Git history references
  `rzp_live_...` only with the value elided; the only literal key strings in
  history are fake placeholders (`rzp_test_xyz`, `rzp_test_secret_abc123`) that
  lived in a deleted test script.
- The real keys lived in the **Vercel environment variables**, which is why
  production reported `razorpayConfigured: true`.
- `server/src/services/paymentService.js` was **dead duplicate code** — a second,
  unused Razorpay implementation with zero references anywhere.

**Changes**

| File | Change |
|------|--------|
| `server/src/config/index.js` | Derive mode from the key prefix; refuse live keys; enable payments only for a well-formed `rzp_test_` pair. Also fixed the currency-symbol default, which was `'?'` instead of `'₹'` (mojibake) |
| `server/src/services/razorpayService.js` | `isRazorpayConfigured()` now returns false for live keys; added `getRazorpayMode()`; signature verification refuses to run unless test mode is active; one-time blocked warning in the logs |
| `server/src/controllers/paymentController.js` | Expose `razorpayMode` + `razorpayLiveBlocked`; error message now explains a blocked live key instead of a vague "not configured" |
| `server/src/services/paymentService.js` | **Deleted** (dead code) |
| `server/.env.example` | Rewritten with test-mode guidance |

`orderController.js` needed no changes — it already gates online orders on
`isRazorpayConfigured()` and verifies via `verifyRazorpaySignature()`, both of
which now enforce test mode automatically.

**Verified** — 7 key scenarios, all correct:

| Input | Mode | Blocked | Payments |
|---|---|---|---|
| no keys | `none` | no | off |
| `rzp_test_…` pair | `test` | no | **on** |
| `rzp_live_…` pair | `live` | **yes** | off |
| unknown prefix | `unknown` | no | off |
| test id + **live secret** | `live` | **yes** | off |
| **live id** + test secret | `live` | **yes** | off |
| test id, no secret | `test` | no | off (partial pair) |

Two bugs surfaced during testing and were fixed: a live *secret* originally
slipped through, and the `RAZORPAY_ALLOW_LIVE` escape hatch was dead code that
didn't work. Since the requirement is test-only, the override was removed
entirely rather than repaired.

### 8. Deployment hygiene

- Deleted 6 stale `server/*.log` files (leftovers from an old working directory; not
  git-tracked, but still uploaded to Vercel on every deploy).
- Added `server/.vercelignore` and `client/.vercelignore` — Vercel ignores
  `.gitignore`, so without these the local `node_modules/` (10k+ files), `dist/`,
  logs and Docker files uploaded on every deploy.
- Extended `.gitignore` to cover stray `*.log` files.

**Verified clean:** no dead/unreferenced source files, no unused dependencies, no
`TODO`/`FIXME`, no stray `console.log`, production bundle **0.63 MB**.

---

## 🧪 Verification

Everything below was run against the **live** deployment.

**Endpoint status codes**

| Request | Status | Expected |
|---|---|---|
| `/`, `/health`, `/ready` | 200 | ✅ |
| `/api/foods`, `/api/categories`, `/api/featured` | 200 | ✅ |
| `/api/auth/providers` | 200 | ✅ |
| `/api/wishlist`, `/api/orders/me`, `/api/admin/users` (no token) | 401 | ✅ |
| `/api/nope`, `/api/auth/nope` | 404 | ✅ |
| `/api/admin/stats` (normal user) | 403 | ✅ |

**Full user lifecycle**

```
register 201 · login 200 · me 200 · refresh 200 · address 201
order preview 200 · coupon WELCOME10 → discount applied
create order 201 · order detail 200 (pending) · cancel 200 (cancelled)
wishlist add/get/remove 200 · chatbot 200 · logout 200
```

**Google OAuth:** callback URI returns **VALID** (reaches Google's account chooser).

**Frontend pages:** `/`, `/menu`, `/login`, `/register`, `/cart`, `/checkout`,
`/orders`, `/oauth-callback` all return 200.

> 💡 Gotchas when testing by hand: the address field is **`pincode`** (not
> `postalCode`), order items use **`food`** (not `foodId`), the foods payload is under
> **`data.items`** (not `data.foods`), and wishlist takes the ID in the **path**
> (`POST /api/wishlist/:foodId`). Coupons are `WELCOME10`, `FLAT50`, `FOODIE20`.

---

## ⚠️ Outstanding Work

### 🔴 Security — do these first

A full **Vercel token** and production credentials were exposed in an earlier
session. Anyone with that token can read and modify these deployments.

- [ ] **Revoke the exposed Vercel token** (Vercel → Settings → Tokens), issue a new one.
- [ ] **Rotate production secrets:** MongoDB URI, JWT secrets, Google OAuth secret,
      Razorpay keys, Resend API key. Update in Vercel and redeploy.
- [ ] **Check MongoDB Atlas IP access list** and audit logs for unfamiliar activity.
- [ ] **Swap the Vercel Razorpay keys to test keys.** Production currently holds a
      live key, which the new code refuses — so online payments are OFF and only
      COD works until you set `RAZORPAY_KEY_ID=rzp_test_…` +
      `RAZORPAY_KEY_SECRET=…` in the Vercel API project and redeploy. That is the
      intended safe state, but it must be done deliberately.
- [ ] **Rotate the Razorpay live keys in the Razorpay dashboard** — they were
      exposed in an earlier session and are no longer used by this project.

### 🟡 Cleanup

- [ ] **Delete leftover test accounts** — several `probe…@example.com` users exist.
      There is **no delete-user endpoint** (admin only has `toggle-active`), so remove
      them via MongoDB Atlas or add a delete endpoint.
- [ ] Decide whether the legacy `https://foodhub-api-u3oy.onrender.com/...` redirect
      URI should stay in the Google console.

### 🟢 Optional

- [ ] Catalogue edits take up to 30s to appear publicly (cache TTL). Lower the TTL in
      `server/src/routes/foodRoutes.js` if you want instant updates.
- [ ] Add an uptime monitor on `/api/health`.

---

## 🛠 Local Development

```bash
npm run setup          # install server + client deps
npm run seed           # seed the database
npm run dev            # run API (:5000) and client (:5173)
```

Copy `server/.env.example` → `server/.env` and fill in your keys. The local client
proxies `/api` to `http://localhost:5000` (see `client/vite.config.js`), so the local
Google callback is `http://localhost:5000/api/auth/google/callback`.

### Demo accounts (from the seeder)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@foodhub.com` | `Admin@123` |
| Customer | `user@foodhub.com` | `User@123` |
| Delivery | `delivery@foodhub.com` | `Delivery@123` |

> The live admin password **has been changed** and is not the seeded default.

---

## 📁 Project Layout

```
FoodHub/
├── client/                  React SPA (Vite)
│   ├── src/api/             axios instance + endpoint map
│   ├── src/components/      layout, food, auth, chat, ui
│   ├── src/pages/           customer, admin, delivery, auth
│   ├── src/store/           zustand (auth, cart, ui)
│   ├── src/utils/           token storage, formatting
│   ├── vercel.json          /api rewrite → API project
│   └── .vercelignore
├── server/                  Express API
│   ├── src/config/          env, database, logger, oauth, sentry
│   ├── src/controllers/     auth, oauth, food, order, payment, admin, chatbot
│   ├── src/routes/          route tables
│   ├── src/models/          Mongoose schemas
│   ├── src/middlewares/     auth, validate, error
│   ├── src/validators/      zod schemas
│   ├── src/utils/           jwt, cookie, helpers, seeder
│   └── .vercelignore
└── .github/                 CI workflows
```

---

## 📝 Recent Commits

| Commit | Description |
|--------|-------------|
| `2ff9911` | perf: cache public catalogue reads and retry transient network failures |
| `6c1b335` | fix(server): make cold-start DB bootstrap self-healing, retry client 503s |
| `648a0e7` | fix(auth): repair Google OAuth `redirect_uri_mismatch` and URL parsing |
| `d9f8f04` | fix(client): always call the API same-origin instead of a baked `VITE_API_URL` |
| `bec7e24` | fix(api): survive cross-region Atlas latency on Vercel serverless |