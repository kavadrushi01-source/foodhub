---
title: FoodHub API
emoji: 🍔
colorFrom: orange
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
short_description: Express + MongoDB REST API powering the FoodHub app
---

# FoodHub API (server)

Docker Space running the FoodHub Express API. The build context is this
folder — the same `Dockerfile` used for local / Render / Koyeb deploys
($PORT-driven, defaults to **7860** as required by HF Spaces).

## How this Space gets updated

It is synced automatically from
[`kavadrushi01-source/foodhub`](https://github.com/kavadrushi01-source/foodhub):
`.github/workflows/deploy-hf.yml` pushes the contents of `server/` here on
every push to `main`.

**Do not edit files in this Space directly — they will be overwritten on the
next deploy.**

## Required secrets

Set these in **Settings → Variables and secrets** (they are injected as env
vars at runtime; `.env` is never baked into the image):

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | long random string (32+ chars) |
| `JWT_REFRESH_SECRET` | long random string (32+ chars) |
| `CLIENT_URL` | `https://foodhub-seven-gules.vercel.app` |
| `API_URL` | `https://rushi126-foodhub-api.hf.space` |
| `COOKIE_SECURE` | `true` |

## Endpoints

- `GET /health` — liveness probe (used by the keep-alive cron)
- `GET /ready` — readiness probe (MongoDB connected?)
- `GET /` — service info
- All business routes live under `/api/...`
