# 🧠 HOW I BUILT THIS — FoodHub, from scratch to shipped

A first-person, step-by-step journal of how the FoodHub food-delivery platform was planned and built — MERN + Tailwind + an AI chatbot. Written for learners who want to see how a real full-stack project comes together (and the mistakes made along the way).

---

## 0. The idea

> "A food delivery website like a real one — with customer ordering, an owner dashboard, delivery partners, coupons, payments, and an AI assistant."

That single sentence became the north star. Every feature decision traced back to it. Writing it down first mattered more than writing code first.

### What I wanted to learn
- Full-stack architecture: client, API, database, auth, roles.
- Real security basics (hashed passwords, tokens, rate limits).
- Production-grade file organization, not a "one-file app".
- How to make a UI that actually looks premium.

---

## 1. Planning before code

### Chose the stack (and why)
| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + Vite | Fast dev, huge ecosystem, component model |
| Styling | Tailwind CSS | Utility classes = fast, consistent design system |
| State | Zustand | Tiny, no boilerplate vs Redux |
| Backend | Node + Express | Same language as frontend; huge middleware ecosystem |
| Database | MongoDB + Mongoose | Flexible schemas for a food catalog |
| Auth | JWT + bcrypt | Industry standard access tokens + hashed passwords |

### Defined the database first (sketch, not code)
```
users       -> name, email, password, phone, role, isEmailVerified, addresses
foods       -> name, slug, price, category, images, isVeg, stock, rating
categories  -> name, slug, image
orders      -> user, items[], address, totals, status, paymentMethod, coupons[]
reviews     -> user, food, rating, comment
coupons     -> code, type(%/flat), value, minOrder, maxUses
settings    -> deliveryFee, freeDeliveryThreshold, taxRate, payment toggles
```
Designing the schema first saved days. Every feature mapped back to a collection.

---

## 2. Backend skeleton

```
server/
  src/
    app.js            -> express app (middleware + route mounting)
    server.js         -> entry point (connect DB, listen)
    config/           -> env, logger, database, oauth
    models/           -> Mongoose schemas
    routes/           -> authRoutes, foodRoutes, orderRoutes, adminRoutes...
    controllers/      -> business logic per domain
    middlewares/      -> protect, validate, errorHandler
    utils/            -> jwt, cookies, helpers, seeder
    validators/       -> zod schemas
```

**Lesson:** *separation of concerns*. Route = "which URL", Controller = "what happens", Model = "what data looks like", Middleware = "checks in between". New devs who see this for the first time get it in 10 minutes.

A tiny example — how a request flows:

```js
// routes/foodRoutes.js
router.get('/foods', asyncHandler(food.getFoods));
```
```js
// controllers/foodController.js
export const getFoods = async (req, res) => {
  const result = await Food.paginateAndFilter(req.query);
  res.json({ success: true, data: result });
};
```

---

## 3. Authentication — the heart

### Password storage
`bcrypt.hash(password, salt)` on save; passwords stored with `select: false` so they're never returned accidentally. `comparePassword()` checks login.

### Tokens
- **Access token** — short-lived (15 min) JWT: `{ sub: userId, name, email, role }`.
- **Refresh token** — long-lived (7 days) JWT; used only at `/auth/refresh` to mint a new access token.
- Both signed with separate secrets; tokens carry the **role** so middleware can gate endpoints.

### Middleware chain
```
request → protect (verifies JWT, loads user) → requireRole('admin') → handler
```

### Email verification & reset
A random token is generated, **hashed (sha256)** and stored with an expiry; the raw token goes in the email link. This means even a DB leak can't be used directly.

---

## 4. Food catalog, search, filter, sort

Built a reusable query engine on the Food model:
- `search` → regex across name + description
- `category` → filter by slug
- `isVeg` → veg/non-veg toggle
- `minPrice/maxPrice`, `sort` (`popular`, `price-asc`…), `page/limit` pagination

All from one endpoint: `GET /api/foods?search=..&category=..&sort=popular&page=1`.

---

## 5. Cart → Checkout → Orders

### Cart
Cart lives client-side (Zustand + localStorage) — instant, no round-trips. On checkout it's sent to the API.

### Order math (server-side, always)
The server recomputes totals — **never trust the client**:
```
subtotal → coupon discount → delivery fee (waived on online payment) → tax → grandTotal
```
`POST /api/orders/preview` returns the computed bill; `POST /api/orders` creates the order with a human-friendly order number like `FHK68M2Z019`.

### Status pipeline
```
Pending → Confirmed → Preparing → Out for Delivery → Delivered
```
Cancellation allowed early; refunds auto-triggered for online payments.

---

## 6. Coupons

`coupons` collection with `type: percent|flat`, `value`, `minOrder`, `maxUses`. `applyCoupon` validates code, expiry, and usage count, then recomputes the bill. Applying a coupon became a chatbot FAQ too ("how do I apply a coupon?").

---

## 7. Payments

- **COD** — flag on the order, done.
- **Razorpay** — integration pattern: create a gateway order server-side, return a `transactionId`, let the client complete the UPI/Card flow, then `POST /api/orders/:id/payment/confirm` verifies the signature **server-side** before marking paid. Never trust a client-side "it worked".

---

## 8. Roles: Admin & Delivery dashboards

One auth system, three worlds via `role` + a `requireRole` guard:

| Role | Guard | Can do |
|------|-------|--------|
| user | — | orders, wishlist, reviews, addresses |
| admin | `requireRole('admin')` | store CRUD, all orders, users, analytics, settings |
| delivery | `requireRole('delivery')` | assigned deliveries, status + OTP verify, earnings |

Admin analytics came from **MongoDB aggregation pipelines** (group orders by date for the 30-day revenue chart, top foods by quantity sold, etc.).

---

## 9. The AI Chatbot ("Foodie")

A fully self-contained assistant — **no external API, no cost, works offline**:

```
chatbotKnowledge.js
  INTENTS = [ { id, re: regex, reply (string or fn) } , … ]
  matchIntent(q):
    1. try math solver ("what is 100-20" → 80)
    2. for each intent, test regex → score
    3. pick the highest score (ties break by order)
    4. else a friendly fallback
```

- 80+ intents: ordering, delivery, payments, coupons, menu, hours, refunds, jokes, trivia.
- Reply functions can use the query (e.g. bare "pizza"/"momos" → "We've got X on our menu…").
- Suggestion chips after every answer keep the conversation moving.
- Guest-accessible (mounted before the protected food router — see "Bugs I hit").

---

## 10. Frontend — making it feel premium

- **Design system first:** a custom Tailwind palette (`brand` orange, `ink` slate), gradient utilities, shadow tokens, keyframe animations (fade-in-up, marquee ticker, float, shimmer skeletons).
- **Layout:** sticky glass navbar, mobile sidebar, cart drawer, footer — all shared via one `Layout`.
- **Pages by role:** `pages/` for customers, `pages/admin/`, `pages/delivery/`, `pages/auth/`.
- **State:** Zustand stores — `authStore` (token + user), `cartStore`, `uiStore` (drawers, theme).
- **UX touches:** skeleton loaders, empty states, toasts, dark mode, live chat widget with typing dots.

---

## 11. Security checklist (what I actually did)

- bcrypt hashing, `select: false` passwords
- short-lived JWT + refresh rotation, httpOnly cookies
- helmet, CORS allow-list, rate limiting (global + auth)
- express-mongo-sanitize (NoSQL injection)
- zod validation on every endpoint
- role-based middleware; admin/delivery locked down (verified: customer on `/admin/*` → 403)

---

## 12. Testing & CI

- Manual API suites hit every endpoint: public, auth guards, customer journey (register→wishlist→address→order), admin CRUD, delivery flows, role-403 checks.
- **Result after the final run: 42/42 + 16/16 checks passed.**
- GitHub Actions CI: install → lint → server syntax-check → client build → boot API against Mongo and hit `/health`.

---

## 13. Bugs I actually hit (learning gold)

1. **Atlas "Could not connect"** — my IP wasn't whitelisted. Fixed by using local MongoDB for dev. Lesson: check infrastructure before debugging code.
2. **Chatbot returned 401 for guests** — a public router mounted *after* a router with a blanket `router.use(protect)` got auth-gated first. Fixed by ordering public routes first. Lesson: middleware order in Express is everything.
3. **Duplicate seed foods** — auto-slugged clones appeared twice in the menu. Fixed with a name→id category mapping and slug de-dupe.
4. **The shell killed my background server** — child processes were killed when the terminal command ended; launched the server fully detached (WMI) instead.

---

## 14. Lessons that stick

- **Plan the DB schema before writing APIs.**
- **Never trust the client** for prices, discounts, or payment confirmations.
- **Middleware order** and **route mounting order** decide what's public/private.
- **Secrets live in `.env`, never in the repo** — `.gitignore` is your friend.
- A "simple" feature (chatbot) can be built with a tiny intent engine, no ML needed.
- Test the flows you care about (order → payment → delivery) end-to-end, not just happy paths.

---

## 15. Where to go next

- Real-time order updates (Socket.IO / SSE) instead of polling.
- Mobile push notifications for status changes.
- Geolocation-based nearest kitchen / delivery fee.
- Plug in an LLM (OpenAI/Claude) behind the chatbot for open-ended questions.

---

*This journal is part of the FoodHub repo: code in [`server/`](./server) and [`client/`](./client), usage in [`WEBSITE_GUIDE.md`](./WEBSITE_GUIDE.md), quick start in [`README.md`](./README.md).*