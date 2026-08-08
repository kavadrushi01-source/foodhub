# 🚀 FoodHub — Deployment Guide

Where the project actually runs in production, how it's wired, and the
step-by-step path from the laptop to the internet.

---

## 1. Where it's deployed (live URLs)

| Part | Host | URL |
|------|------|-----|
| **Frontend** (React SPA) | **Vercel** | <https://foodhub-vignette-gules.vercel.app> |
| **Backend** (Express API) | **Render** | <https://foodhub-api-u3oy.onrender.com> |
| **Database** | MongoDB **Atlas** (cloud cluster) | connection string stored in Render env |
| **Email** | **Resend** (SMTP) | sandbox/test mode for now |

> Both apps are **separately auto-deployed** from this GitHub repo — push to
> `main` and each platform rebuilds itself.

## 2. How the client talks to the API

- Dev: Vite **proxies** `/api` → `http://localhost:5000` (no CORS).
- Prod: the client is built with `VITE_API_URL` = `https://foodhub-api-u3oy.onrender.com/api`
  so every axios call goes to Render.
- **Fix along the way:** the front-end claimed 404 on `/api/...` until
  `VITE_API_URL` pointed at the full `.../onrender.com/api` path.

## 3. SPA routing on Vercel (deep links)

React Router URLs like `/menu`, `/admin/orders` normally 404 on static hosting.
`client/vercel.json` **rewrites all paths → `/index.html`** (SPA fallback), so
every deep link loads the app.

## 4. Server env (set in Render dashboard)

The real file is **never** in the repo — copy `server/.env.example` and fill URLs.

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>
JWT_ACCESS_SECRET=<long random string>
JWT_REFRESH_SECRET=<long random string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECURE=true            # production must be secure-only cookies
COOKIE_SAMESITE=lax
CLIENT_URL=https://foodhub-gules.vercel.app
API_URL=https://foodhub-api-u3oy.onrender.com
GOOGLE_CLIENT_ID=<...>        # Google OAuth
GOOGLE_CLIENT_SECRET=<...>
EMAIL_HOST=<resend smtp>
EMAIL_USER=<resend key>
EMAIL_PASS=<resend key>
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=rzp_live_...
CURRENCY=INR
CURRENCY_SYMBOL=₹
```

Secrets live in the platform's "Environment" / are **never** committed.

## 4. Payments: Razorpay (LIVE, verified)

- Created Razorpay account → approved → generated **LIVE** keys.
- Set keys in Render env.
- Verified in production: `GET /api/payments/config` →
  `{ razorpayConfigured: true, methods: ["cod","upi","razorpay"] }`.
- Checkout offers **COD / UPI / Razorpay**; the server verifies each signature in
  `POST /api/payments/verify` before confirming the order.

## 5. Email: Resend (sandbox)

- SMTP configured via nodemailer.
- Currently **sandbox**: emails only deliver to the verified test email.
- To go full production: buy a domain → verify in Resend → update `EMAIL_FROM`
  (e.g. `FoodHub <noreply@foodhub.in>`) → set in Render env.

## 6. Production security checklist

- [x] `.env`/`.env.local` **gitignored**; only `server/.env.example` committed
- [x] Real keys (Atlas, Google OAuth, Razorpay, JWT) exist **only** in Render env
- [x] Random JWT secrets rotated (2026-07)
- [x] `COOKIE_SECURE=true`, `sameSite=lax` in production
- [x] Helmet, CORS allow-list, rate limiting, mongo-sanitize, zod, bcrypt
- [ ] (optional) rotate Google OAuth client secret for good hygiene
- [ ] (optional) custom domain for the frontend

## 7. If anything goes down

1. `Render` → your web service → **Logs** tab — see the crash line.
2. `Vercel` → deployment log — see build/route errors.
3. Health: `GET https://foodhub-api-u3oy.onrender.com/health` → `200`.
4. Common: CORS wrong URL, missing env var in Render, `.env` from laptop not copied.

## 8. Prod re-render wishlist (next time)

- WebSocket/SSE for live order status (now it's polling).
- Unit tests in CI (chatbot matcher, order totals).
- Docker compose + staging/prod environment separation.
- Buy a custom domain for branding.