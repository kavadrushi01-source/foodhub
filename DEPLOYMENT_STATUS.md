# FoodHub — Deployment & Project Status Tracker

> **Purpose:** Single source of truth for the whole website status. All progress, completed work, remaining work, environment config, and deployment state is recorded here. Update this file after every session.

---

## 1. Latest Status Snapshot

**✅ THE WEBSITE IS LIVE** (verified end-to-end 2026-08-07)

| Area | Status | URL |
|------|--------|-----|
| Frontend (VERCEL) | ✅ LIVE | `https://foodhub-seven-gules.vercel.app` |
| Backend (RENDER) | ✅ LIVE & healthy | `https://foodhub-api-u3oy.onrender.com` |
| Database (MongoDB Atlas) | ✅ Connected, seeded | — |
| Auth (login) | ✅ Working live | — |
| CORS (frontend→backend) | ✅ Configured | Vercel → Render |
| Git hosting | ✅ `rushiahir/foodhub` (main account) | `https://github.com/rushiahir/foodhub` |

**Live checks passed:**
- `GET /health` → `{ success: true, env: production }`
- `GET /api/foods` → 8 items
- `POST /api/auth/login` (user@foodhub.com) → success, role `user`
- Frontend returns HTTP 200, built with correct `VITE_API_URL`
- Render CORS origin = `https://foodhub-seven-gules.vercel.app`

**⚠️ Remaining before "fully production-ready":** live Razorpay keys (site under review), real SMTP email, RAZORPAY/STRIPE keys in Render env (COD works now).

---

## 2. Project Overview

- **Name:** FoodHub — Food E-Commerce Platform (MERN)
- **Stack:** MongoDB, Express.js, React 18 + Vite, Node.js
- **Repo:** `https://github.com/rushiahir/foodhub.git` (branch `main`, main account)
- **Local URLs:** Backend `http://localhost:5000` · Frontend `http://localhost:5173` (or 5174 if 5173 busy)
- **Live:** Frontend `https://foodhub-seven-gules.vercel.app` · Backend `https://foodhub-api-u3oy.onrender.com`

### Structure
```
├── server/                 # Express REST API (port 5000)
│   └── src/
│       ├── config/         # env, logger, database, oauth
│       ├── models/         # Mongoose schemas
│       ├── controllers/    # Auth, Food, Order, Admin, User
│       ├── routes/         # API route definitions
│       ├── middlewares/    # auth, validate, error handling
│       ├── services/       # email service
│       ├── utils/          # jwt, cookies, seeder, helpers
│       └── validators/     # zod schemas
├── client/                 # React SPA (Vite)
│   └── src/
│       ├── api/            # axios client + services
│       ├── components/     # ui, layout, food
│       ├── pages/          # customer / admin / delivery / auth
│       ├── store/          # zustand stores
│       └── utils/
└── *.md                    # bug-fix & status docs
```

---

## 3. What's DONE (Completed)

### Features (all working)
- ✅ Authentication — JWT access + refresh tokens, httpOnly cookies, email verify, forgot/reset password, role-based (User / Admin / Delivery)
- ✅ Food catalog — categories, full-text search, filters (category, veg/non-veg, price), sort, pagination
- ✅ Food detail — nutrition, ingredients, allergens, ratings, reviews, related items
- ✅ Wishlist — saved per user
- ✅ Cart — persistent, quantity controls
- ✅ Coupons — percentage/fixed, min-order & usage limits
- ✅ Checkout — address management, COD fully working (Razorpay/Stripe integration point ready)
- ✅ Order tracking — status timeline, invoice summary, cancellations & refunds
- ✅ Admin dashboard — analytics, food/category/coupon CRUD, order mgmt, users, store settings
- ✅ Delivery partner dashboard — assigned deliveries, OTP verification, earnings
- ✅ Platform — dark/light mode, skeleton loaders, responsive mobile-first UI
- ✅ Root route `/` returns API info (avoids 404)
- ✅ Auto-seed empty production DB on server startup (idempotent)

### Bugs fixed previously (tracked in BUGFIX_REPORT.md / CHECKOUT_FIX_SUMMARY.md / REGISTRATION_FIX.md)
- ✅ Address schema missing `_id` field → fixed in `server/src/models/User.js`
- ✅ Food model virtuals broken with `.lean()` → inline effectivePrice in `orderController.js`
- ✅ Checkout blank screen / cart drawer overlay stuck → fixed `CartDrawer.jsx` + `Checkout.jsx`
- ✅ Axios interceptor double `.data` access → corrected across checkout
- ✅ CORS localhost-port mismatch → regex `http://localhost:\d+` in dev (`server/src/app.js`)

### Verified (session 2026-08-07, after laptop restart)
- ✅ Backend starts on port 5000, `GET /health` → `{ success: true }`
- ✅ MongoDB Atlas reachable (`ac-mriz0lj-shard-00-00.rqdhqzo.mongodb.net:27017`) — DB seeded
- ✅ Login works: `user@foodhub.com` / `User@123` → role `user`
- ✅ Foods API returns seeded items (e.g. "Salmon Nigiri Platter", INR 399)
- ✅ Frontend `client/dist` production build present and valid
- ✅ Node v24.15.0, npm 11.12.1

---

## 4. What's PENDING (Remaining Work)

### Deployment (the current blocker)
- ❌ **Choose hosting platform** — Render / Railway / Vercel / Netlify / VPS (user decision needed)
- ❌ **Backend deployment** — add platform config (e.g. `render.yaml`, Procfile, Dockerfile), env vars, deploy
- ❌ **Frontend deployment** — host `client/dist` (Netlify/Vercel/Render static) and set `VITE_API_URL` to live backend
- ❌ **Production env setup** — `NODE_ENV=production`, `CLIENT_URL=<live frontend>`, `API_URL=<live backend>`, CORS origin, `COOKIE_SECURE=true`, `COOKIE_SAMESITE` (none/lax), JWT secrets
- ❌ **Custom domain** (optional) — HTTPS + domain wiring

### Post-deploy verification (to run once live)
- [ ] Hit live `/health` and `/`
- [ ] Test CORS from live frontend origin
- [ ] Test full user journey: register → login → browse → cart → checkout (COD) → order tracking
- [ ] Test email verification + password reset on live SMTP
- [ ] Verify admin + delivery dashboards live

### Optional / future work
- [ ] Razorpay/Stripe live keys wiring (currently integration point only; COD works)
- [ ] Payment gateway UPI enablement
- [ ] Duplicate schema-index warning cleanup (cosmetic)
- [ ] Add loading states & form validation across remaining pages
- [ ] Frontend prod testing scripts

---

## 5. Environment & Configuration

### Server `.env` (currently ALL development values — MUST change for prod)
| Var | Current (dev) | Prod needed |
|-----|---------------|-------------|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `5000` | platform-assigned |
| `MONGODB_URI` | Atlas (set) | keep / rotate |
| `CLIENT_URL` | `http://localhost:5173` | live frontend URL |
| `API_URL` | `http://localhost:5000` | live backend URL |
| `COOKIE_SECURE` | `false` | `true` |
| `COOKIE_SAMESITE` | `lax` | `none` or `lax` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev defaults | strong random |
| `GOOGLE_CLIENT_ID/SECRET` | set | set (callback uses `API_URL`) |
| `EMAIL_*` | ethereal (dev) | real SMTP (e.g. Resend/SendGrid) |
| `RAZORPAY_KEY_ID/SECRET` | empty | set if using gateway |

### Client
- `client/vite.config.js` — dev proxy `/api` → `http://localhost:5000`
- `client/src/api/axios.js` — `baseURL = import.meta.env.VITE_API_URL || '/api'`; set `VITE_API_URL` at build time for prod
- Vite proxy only helps in dev; production SPA must call the live API URL (or same-origin reverse proxy)

### Demo accounts (seeded)
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@foodhub.com` | `Admin@123` |
| Customer | `user@foodhub.com` | `User@123` |
| Delivery | `delivery@foodhub.com` | `Delivery@123` |

---

## 6. Useful Commands

```bash
# Install
npm run setup                 # installs server + client deps
npm run seed                  # seed demo data

# Run (dev)
npm run dev                   # both servers (concurrently)
npm run dev:server            # backend on :5000
npm run dev:client            # frontend on :5173 (or 5174)

# Build / start
npm run build                 # build client -> client/dist
npm run start                 # start backend (node src/server.js)

# Health check
Invoke-RestMethod http://localhost:5000/health
```

---

## 7. Session Log (append after each session)

### 2026-08-07 — Post laptop-restart status check
- Verified backend boots & `/health` OK, DB connected & seeded, login works, frontend build valid.
- **Finding:** no live deployment exists; production URLs/platform not configured.
- **Decision needed:** pick hosting platform → then deploy backend → frontend → verify live.

### (Next session: record here)
- ...

---

*Maintained as the single source of truth for FoodHub project & deployment status.*
