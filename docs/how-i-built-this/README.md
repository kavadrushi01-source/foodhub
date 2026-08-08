# HOW_I_BUILT_THIS — FoodHub, From Scratch

A practical walkthrough of how this food-delivery MERN project was designed, built, and shipped — written for learning, and to explain the whole journey step by step.

> 📁 **In this folder:**
> - [`README.md`](./README.md) — this full build story (idea → code → ship)
> - [`BUG_FIXES_LOG.md`](./BUG_FIXES_LOG.md) — every bug we hit and how we fixed it
> - [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) — where it's deployed and how

---

## 1. The idea

Build a **complete, production-style food e-commerce web app** — not a tutorial toy, but something a small restaurant could actually use:

- **Customers**: browse menu → add to cart → checkout → track the order
- **Admin/Owner**: manage foods, orders, coupons, users, revenue analytics
- **Delivery partner**: pick orders, deliver, verify with OTP, see earnings
- Plus an **AI assistant** that answers customer questions instantly

## 2. Technology choices (and why)

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js + Express | Fastest path to a JSON API we control end-to-end |
| Database | MongoDB + Mongoose | Flexible documents; free Atlas tier |
| Frontend | React + Vite | Components, hot-reload, fast builds |
| Styling | Tailwind CSS + Framer Motion | Utility-first speed + premium animations |
| State | Zustand | Tiny, no boilerplate |
| Validation | zod | Type-safe request validation |
| Auth | JWT (access + refresh) | Stateless, industry standard |
| Language | JavaScript (ESM) | One language across the whole stack |

Architecture note: API lives in `server/`, SPA in `client/`. In dev, Vite proxies `/api` to the server (no CORS pain). Cookies use `httpOnly + sameSite`.

## 3. Backend — building the API

### 3.1 Folder model (separation of concerns)
- `config/` — env, logger (winston), database, oauth
- `models/` — Mongoose schemas
- `controllers/` — request handlers, thin business logic
- `routes/` — URL → controller wiring + middleware
- `middlewares/` — protect (JWT), role guard, validation, error handler
- `services/` — email (nodemailer), external IO
- `utils/` — jwt, cookies, seeder, chatbot knowledge
- `validators/` — zod schemas

### 3.2 Data models (the backbone)
- **User** — name, email, password (bcrypt-hashed, `select:false`), phone, role (`user`/`admin`/`delivery`), `isActive`, verification/reset tokens
- **Food** — name, slug, price, `isVeg`, images, stock, category ref, ratings
- **Category** — name, display order
- **Coupon** — code, type (%/flat), min order, usage limits, active/expiry
- **Order** — items[] (food ref + qty + **price snapshot**), address, payment method, charges, status timeline, delivery partner ref, delivery OTP
- **Review** — user, food, rating, text, helpful votes

> Price snapshot on each order item is the money lesson of e-commerce: prices change, but a placed order must remember what you charged then.

### 3.3 Auth flow (the heart)
1. **Register** → bcrypt-hash password → create user → email verification token → issue JWT tokens
2. **Login** → verify password → issue tokens (httpOnly cookies + response body)
3. **JWT**: short-lived access token (15m) + long-lived refresh token (7d)
4. **protect middleware** — reads `Bearer` header first (tab-scoped), then cookie; verifies signature + expiry; reloads user fresh from DB
5. **Role guard** `authorize('admin')` → 403 on mismatch (verified by a test)
6. Passwords/secrets never returned in responses; `toJSON` strips sensitive fields

### 3.4 Security middleware layer
- `helmet`, `cors` allow-list, `express-rate-limit` (global + auth), `express-mongo-sanitize` (NoSQL injection), zod validators, central error handler with custom error classes

### 3.5 Orders, coupons & payments
- Server computes totals (subtotal → delivery fee → tax → coupon → grand total) — never trust a client-computed total
- **Coupon** validated server-side (active, min order, usage limits)
- **Order create** → `pending`, order number, delivery OTP
- **Razorpay** isolated: `POST /payments/order` creates a gateway order; signature verified server-side at `payment/confirm`; test keys first

### 3.6 The AI chatbot (a rules engine)
Instead of paying per-token for an LLM, the assistant is a **deterministic rule engine**:
- `INTENTS` list — each has id, regex, reply (string or function), suggestions
- `answerChatbot()` normalizes text → runs all regexes → scores → picks highest (stable ties → earlier wins)
- Math solver runs first (`what is 100-20` → `80`); last resort is a friendly fallback with suggestions
- Returns `{ reply, suggestions }`; the frontend renders reply + tappable chips

Lessons: order intents specific-first; bare food words (`pizza`) get a "go browse the menu" intent; "apply a coupon" must beat plain `coupon`.

## 4. Frontend — the SPA

### 4.1 Setup
- React Router with **lazy-loaded** pages (code-split → smaller bundle)
- **Zustand stores**: auth (user + token, persisted), cart, ui, orders
- Axios interceptors: attach `Authorization`, refresh on 401, redirect on logout

### 4.2 Pages
- **Shop**: Home, Menu (filter/sort/search), FoodDetail, Cart, Checkout, Orders, OrderDetail, Wishlist, Profile
- **Auth**: Login / Register / Forgot / Reset / Verify-email / Social callback
- **Admin**: Dashboard (charts), Foods, Categories, Coupons, Orders, Users, Reviews, Settings
- **Delivery**: Today's, Order detail, Earnings

### 4.3 The chat widget (client side)
- Floating FAB, z-index placed between navbar and modal overlays so it never blocks the cart drawer
- Chat **persists** to `localStorage` (history + open state survive reloads)
- Typing indicator, quick-question chips, server suggestions, **FAQ panel** grouped by topic, clear-chat
- Calls `chatApi.ask()` → `POST /api/chatbot/ask`

## 5. Seed data & testing

- `server/src/utils/seeder.js` — idempotent: categories → foods → coupons → demo users; de-duplicates slug clones on re-run
- Ran **end-to-end scripts** against the live server (register → login → add → checkout → admin/delivery), then deleted the test scripts before pushing so the repo stays clean; CI (`.github/workflows/ci.yml`) runs lint + build + server boot instead

## 6. Security checklist (what "safe" meant)

- `.env` gitignored; only `.env.example` (placeholders) committed — **real keys never in the repository**
- No hardcoded credentials or personal data in source/docs
- Access/refresh token split + httpOnly cookies
- bcrypt + zod + sanitize + rate-limit + helmet + RBAC
- Production: rotate JWT secrets, `COOKIE_SECURE=true`

## 7. What I'd do differently / next steps

- Add unit tests (Jest/Vitest) for the chatbot matcher + order totals
- Real-time order tracking (WebSocket / SSE) instead of polling
- Push notifications for order status
- Docker compose for local DB + app; staging/prod environments

That's the story: **empty folder → working MERN food-ordering platform with three role dashboards and an AI assistant.**