# FoodHub API (server)

Express + MongoDB REST API powering the FoodHub app.

## Hosting: Vercel (free tier)

The API is deployed on **Vercel as a serverless Express function**
(zero-config — Vercel detects Express and uses `src/app.js` as the function
entry; `app.js` bootstraps Sentry + MongoDB + seed at import time and exports
the app, so warm invocations reuse the pooled connection).

- **Project settings:** Root Directory = `server/`, framework = Express.
  Project name `foodhub-api`; the `vercel.app` subdomain actually assigned to
  this project is <https://foodhub-pearl-tau.vercel.app> (the shorter
  `foodhub-api.vercel.app` name is claimed by a different Vercel account, so it
  cannot be used here — check `/health` on the domain above).
- **Auto-deploys** on every push to `main` (Vercel Git integration) — no
  GitHub Actions deploy workflow and no keep-alive cron needed; serverless
  functions never sleep.
- **Free-plan caps:** 100 GB bandwidth, 1M invocations, 300 s per request,
  2 GB memory per function, 4 active CPU-h/month (Vercel Hobby plan).

## Required environment variables

Set these in the Vercel project → **Settings → Environment Variables**
(for Production *and* Preview):

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your MongoDB Atlas connection string (Secret) |
| `JWT_ACCESS_SECRET` | long random string (32+ chars) (Secret) |
| `JWT_REFRESH_SECRET` | long random string (32+ chars) (Secret) |
| `CLIENT_URL` | `https://foodhub-seven-gules.vercel.app` |
| `API_URL` | `https://foodhub-pearl-tau.vercel.app` |
| `COOKIE_SECURE` | `true` |

> ⚠️ **MongoDB Atlas → Network Access must allow `0.0.0.0/0`** — Vercel's
> egress IPs change (static egress IPs are Pro-only). This is the most common
> cause of `DB_NOT_READY` / connection timeouts.

## Endpoints

- `GET /` — service info
- `GET /health` — liveness probe
- `GET /ready` — readiness probe (MongoDB connected?)
- All business routes live under `/api/...`

## Local development & Docker

```bash
npm ci
cp .env.example .env   # set MONGODB_URI, JWT secrets
npm run seed           # optional demo data
npm run dev            # nodemon on http://localhost:5000
```

The `Dockerfile` (port 7860, `$PORT`-driven) still works on any container
host (local Docker, Koyeb, Render, …) — it runs `src/server.js`, which only
listens; all bootstrap logic lives in `src/app.js`.
