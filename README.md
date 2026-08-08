# 🍔 FoodHub — Full-Stack Food Delivery Platform (MERN)

A production-ready food delivery & e-commerce web app built with the **MERN stack** — MongoDB, Express.js, React.js, Node.js. Includes a **customer storefront**, an **admin dashboard**, a **delivery partner panel**, and an **AI chatbot assistant**.

Built as a learning project. No real secrets are committed — see [Security](#-security--whats-safe-to-push) and the `server/.env.example` placeholder template.

---

## ✨ Features

### Customer
- 🔐 **Authentication** — register/login, JWT access + refresh tokens, httpOnly cookies, email verification, forgot/reset/change password, **Google OAuth** login
- 🍕 **Food Catalog** — category browsing, full-text search, filters (category, veg/non-veg, price), sorting, pagination
- 🍽️ **Food Detail** — description, ingredients, allergens, nutrition, prep time, ratings & reviews (with "helpful" votes)
- ❤️ **Wishlist** — persisted per user
- 🛒 **Cart** — persistent sidebar cart with quantity controls
- 🎟️ **Coupons** — percentage/flat discounts with usage limits & min-order rules
- 💳 **Checkout** — saved addresses, COD + UPI + **Razorpay** payments (live keys optional via `.env`)
- 🚚 **Order Tracking** — live status timeline (Pending → Confirmed → Preparing → Out for Delivery → Delivered), OT Phebs-Verified delivery, cancellations & refunds
- 🤖 **AI Foodie Assistant** — floating chat widget on every page. Knows the menu, orders, delivery, payments, coupons, account help, math, and jokes — with a browsable FAQ & persistent history

### Admin Dashboard
- 📊 **Analytics** — revenue, order counts, top foods, 30-day revenue & category trends
- 🍔 **Menus** — food CRUD, stock levels, categories, coupons
- 📦 **Orders** — full pipeline, delivery assignment, refunds, item-level status
- 👥 **Users** — list, role management, active/inactive toggle
- ⭐ **Reviews** — moderation
- ⚙️ **Store settings** — delivery charges, tax, payment method toggles

### Delivery Partner Panel
- 🛵 Assigned deliveries, live status updates, **OTP verification**, earnings dashboard

### Platform
- 🎨 Premium mobile-first UI — dark/light mode, skeleton loaders, Framer Motion animations, custom Tailwind theme
- 🔒 Security-first: Helmet, CORS allow-list, rate limiting, mongo-sanitize, bcrypt, zod validation, cookie hardening
- 🧩 Clean modular architecture (models / controllers / routes / middleware / services / validators)

---

## 🏗️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Zustand, React Router, Axios, react-hot-toast, lucide-react
- **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, zod, helmet, express-rate-limit, express-mongo-sanitize, winston, nodemailer
- **Database:** MongoDB (local or Atlas)
- **CI:** GitHub Actions — lint, server syntax-check, client build, boot health-check

---

## 🚀 Getting Started

### Prerequisites
- **Node.js ≥ 18** (`node -v`)
- **MongoDB** — local (`mongodb://127.0.0.1:27017`) or a free Atlas cluster

### 1. Install dependencies
```bash
npm run setup
```

### 2. Configure the environment
```bash
cp server/.env.example server/.env
# then edit server/.env:
#   MONGODB_URI=your_mongodb_uri
#   JWT_ACCESS_SECRET=long_random_string
#   JWT_REFRESH_SECRET=another_long_random_string
```
Optional client config: `client/.env` → `VITE_API_URL=/api` (default uses a Vite proxy; keep `/api`).

### 3. Seed demo data (categories, 27+ dishes, demo accounts)
```bash
npm run seed
```

### 4. Run both servers
```bash
npm run dev
```
- **Client:** http://localhost:5173
- **API:** http://localhost:5000  (health check: `/health`)

> On first boot the server auto-syncs demo data (idempotent — safe to restart; see `server/src/utils/seeder.js`). Run `npm run seed` for a one-time bulk seed.

### Demo accounts (seeded)
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@foodhub.com` | `Admin@123` |
| Customer | `user@foodhub.com` | `User@123` |
| Delivery | `delivery@foodhub.com` | `Delivery@123` |

> These exist only on a fresh local seed — change the password once you log in, and **never reuse them on a real deployment**.

### Useful scripts
| Command | What it does |
|---------|--------------|
| `npm run dev` | Runs API + client together |
| `npm run dev:server` | API only (port 5000) |
| `npm run dev:client` | Vite only (port 5173) |
| `npm run seed` | Seed the database |
| `npm run build` | Production build of the client |
| `npm run start` | Run the API only |
| `npm run lint` | ESLint the client |

---

## 📁 Project Structure
```
├── server/                      # Express REST API
│   └── src/
│       ├── app.js               # middleware + route wiring
│       ├── server.js            # entrypoint (DB connect + listen)
│       ├── config/              # env, logger, database, sentry, oauth
│       ├── models/              # User, Food, Category, Coupon, Order, Review, Setting…
│       ├── controllers/         # auth, foods, orders, admin, delivery, chatbot
│       ├── routes/              # API route definitions
│       ├── middlewares/         # protect/optionalAuth, error handler, validators
│       ├── services/            # email (nodemailer/ethereal)
│       ├── utils/               # jwt, cookies, seeder, chatbotKnowledge (intents)
│       └── validators/          # zod schemas
└── client/                      # React SPA
    └── src/
        ├── api/                 # axios client + typed API services
        ├── components/          # ui kit, layout, food cards, chat widget
        ├── pages/               # customer / auth / admin / delivery pages
        ├── store/               # zustand stores (auth, cart, ui)
        └── utils/               # helpers
```

---

## 📖 Docs

- **`WEBSITE_GUIDE.md`** — full how-to-use manual for visitors, admins & delivery partners
- **`HOW_I_BUILT_THIS.md`** — the step-by-step build journal (learning notes, from blank folder to deployed feature set)
- `WEBSITE_SUMMARY.md`, `DEPLOYMENT_STATUS.md`, `BUGFIX_REPORT.md`, `CHECKOUT_FIX_SUMMARY.md`, `REGISTRATION_FIX.md` — older dev/project notes kept in-tree

---

## 🔒 Security & "safe to push" notes

- **Secrets are never committed.** `server/.env` (Atlas URI, Google OAuth secret, JWT secrets, Razorpay keys) is gitignored; only `server/.env.example` (placeholder template) is tracked. Verified: the repo contains **no real keys, URIs, or tokens**.
- Passwords hashed with **bcrypt**, tokens short-lived + refresh rotation, httpOnly/secure/sameSite cookies.
- Rate limiting on all `/api` routes + a stricter auth limiter.
- All user-facing inputs validated with **zod**.

---

## 📝 License

MIT — free to learn from, fork and build on.