# 🍔 FoodHub — Food Delivery & E-Commerce Platform (MERN)

A full-stack **food delivery + e-commerce web app** built with the **MERN stack**
(MongoDB, Express.js, React, Node.js). Three role-based apps in one: **Customer**,
**Admin Dashboard** and **Delivery Partner** — plus a built-in **AI Chatbot assistant "Foodie"**.

> Learning project. No real secrets are committed — copy `server/.env.example` and add your own keys.

---

## 🚀 Live Website

> Try the deployed app right away — no setup needed.

| What | Where |
|------|-------|
| **Website (frontend)** | <https://foodhub-seven-gules.vercel.app> |
| **API (backend)** | <https://foodhub-pearl-tau.vercel.app> |
| API health check | <https://foodhub-pearl-tau.vercel.app/health> |

- Frontend and backend are both hosted on **Vercel** (free tier) — the API runs as a serverless function.

### 📖 New to the site?

**[→ How to Use the Live Website (HOW_TO_USE.md)](HOW_TO_USE.md)** — the complete
walkthrough: signing in, placing a demo order, **test card / CVV / expiry / OTP**,
the fastest **Netbanking** payment, UPI test IDs, the admin panel, the delivery view,
and troubleshooting.

| Guide | What it covers |
|---|---|
| **[HOW_TO_USE.md](HOW_TO_USE.md)** | Using the live site: logins, demo order, test payments |
| **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** | Admin panel in depth: every screen, order pipeline |
| **[WEBSITE_GUIDE.md](WEBSITE_GUIDE.md)** | Every customer/admin/delivery screen, FAQ, API endpoints |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Running it locally / deploying: env vars and setup |

---

## ✨ Features

### 🧑 Customer
- **Authentication** — JWT access + refresh tokens, httpOnly cookies, email verification, forgot/reset password, Google OAuth login, role-based access
- **Food Catalog** — category browsing, full-text search, filters (category / veg / non-veg / price), sorting, pagination
- **Food Detail** — nutrition, ingredients, allergens, ratings, reviews, related items
- **Wishlist** — favourites saved per user
- **Cart** — persistent cart with quantity controls
- **Coupons** — percentage / fixed discounts, min-order and usage limits
- **Checkout** — map-based address entry (search a place or drop a pin, the address
  auto-fills) with saved-address management: **make default**, **delete** (confirmed) and
  duplicate detection. Cash on Delivery (working) + Razorpay integration point
- **Orders** — live status timeline, invoice/payment summary, cancellations and auto-refunds
- **🤖 AI Chatbot** — floating "Foodie" assistant on every page answering 100+ questions
  (orders, delivery, payments, coupons, the menu, small talk, even math) with quick-suggestion buttons and a browsable FAQ panel

### 📊 Admin Dashboard
- Analytics: revenue, order counts, top-selling foods, category stats (real charts)
- Foods (CRUD + stock), categories, coupons management
- Orders — status progression, delivery-partner assignment, refunds
- Users & role management, review moderation, store settings (delivery charge, tax, payment toggles)

### 🛵 Delivery Partner
- Assigned deliveries, OTP-verified completion, earnings, live status updates
- **Live tracking, 100% free** — customers watch the rider move on a live map (road route,
  distance, ETA) while the partner shares GPS from the delivery app

### 🛡️ Platform
- Premium mobile-first UI: dark/light mode, animations, skeleton loaders
- **Maps & routing with no paid keys** — Leaflet + OpenStreetMap tiles, Nominatim
  search/reverse-geocoding and OSRM road routes (with a haversine fallback)
- Security: Helmet, CORS allow-list, rate limiting, mongo-sanitize, bcrypt, zod validation, cookie hardening

---

## 🏗️ Tech Stack

| Layer       | Tools |
|-------------|-------|
| Frontend    | React 18, Vite, Tailwind CSS, Zustand, React Router, Axios, react-hot-toast, lucide-react, Leaflet + react-leaflet |
| Backend     | Node.js, Express, Mongoose, JWT, bcryptjs, zod, helmet, express-rate-limit, winston, nodemailer |
| Database    | MongoDB (local or Atlas) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally **or** an Atlas connection string

### 1. Install dependencies
```bash
npm run setup
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
```
Then edit `server/.env` and set `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
(never commit `.env` — it's gitignored). The app works out of the box with local MongoDB.

### 3. Seed demo data
```bash
npm run seed
```
Creates categories, ~30 dishes, and the demo accounts below.

### 4. Run both servers (development)
```bash
npm run dev
```
- Customer app: <http://localhost:5173>
- API: <http://localhost:5000> (health check: `GET /health`)

Or separately:
```bash
npm run dev:server   # API on :5000
npm run dev:client   # Vite on :5173
```

### Build / lint / start (production-style)
```bash
npm run build        # builds the client
npm run lint         # eslint on client/src
npm start            # serves the API (server)
```

---

## 🔑 Demo Accounts (created by the seeder)

| Role | Email | Password | Use |
|------|-------|----------|-----|
| Admin | `admin@foodhub.com` | `Admin@123` | `/admin` dashboard |
| Customer | `user@foodhub.com` | `User@123` | browse/cart/checkout |
| Delivery | `delivery@foodhub.com` | `Delivery@123` | delivery app |

> 🔐 **Admin panel guide:** [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) — sign-in steps, every
> admin screen, the order-status pipeline, and how to test Razorpay payments.
> 💳 **Payment testing:** card `5267 3181 8797 5449`, any future expiry, any CVV,
> and **any 4–10 digit OTP** (or click *Skip OTP*).

> ⚠️ **Security note:** these are *shared demo* credentials for this public deployment.
> If you fork this project, change the admin password before any real use.

---

## 🤖 AI Chatbot ("Foodie")

A floating gradient button (bottom-right) opens the assistant on every page.
- Regex-based intent engine with **100+ hand-written intents** covering orders, delivery,
  payment, coupons, menu, account, support, fun facts, jokes and math — no external API needed.
- Highest regex **hit-score** wins; otherwise a friendly fallback reply suggests topics.
- Chat history persists across reloads; a **Quick-help FAQ** panel lets you browse answers by topic.
- Source: `server/src/utils/chatbotKnowledge.js`, endpoint `POST /api/chatbot/ask`.

---

## 📁 Project Structure

```
FoodHub/
├── server/                      # Express REST API
│   ├── src/
│   │   ├── config/              # env, logger, database
│   │   ├── models/              # Mongoose schemas (User, Food, Order, ...)
│   │   ├── controllers/         # auth, food, order, admin, user, chatbot
│   │   ├── routes/              # REST route definitions
│   │   ├── middlewares/         # auth (JWT/roles), validate, error handler
│   │   ├── services/            # email service
│   │   ├── utils/               # jwt, cookies, seeder, chatbotKnowledge
│   │   └── validators/          # zod schemas
│   └── .env.example             # template (copy → .env)
└── client/                      # React SPA
    └── src/
        ├── api/                 # axios client + typed service modules
        ├── components/          # ui, layout, food, chat components
        ├── pages/               # customer / auth / admin / delivery
        ├── store/               # zustand stores (auth, cart, ui)
        └── utils/               # formatting helpers
```

---

## 🔒 Security & Best Practices

- ✅ JWT access (short-lived) + refresh-token rotation, httpOnly/sameSite cookies
- ✅ bcrypt-hashed passwords; tokens and password hashes never returned in responses
- ✅ Helmet headers, CORS allow-list, global + auth-specific rate limiting
- ✅ NoSQL-injection protection (`express-mongo-sanitize`)
- ✅ zod validation on every mutating endpoint
- ✅ Role-based access control (`user` / `admin` / `delivery`) with 403 on cross-role
- ✅ Centralized async error handling + structured logging (winston)
- ✅ `.env` is gitignored — only `server/.env.example` (placeholders) is committed

---

## 💳 Payments

- **COD** — fully functional with backend verification and refunds.
- **Razorpay** — integrated at the architecture level: checkout creates a gateway order
  and returns `transactionId`; the client completes the SDK flow then calls
  `POST /api/orders/:id/payment/confirm`. Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `.env`.

---

## 📚 More Docs

- `WEBSITE_GUIDE.md` — how to use the site, role by role

---

## 📜 License

MIT
