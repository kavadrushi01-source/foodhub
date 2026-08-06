# 🍔 FoodHub — Food E-Commerce Platform (MERN)

A production-ready, enterprise-architecture Food Delivery & E-Commerce web application built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js).

## ✨ Features

### Customer
- 🔐 **Authentication** — JWT access + refresh tokens, httpOnly cookies, email verification, forgot/reset password, role-based access (User / Admin / Delivery Partner)
- 🍕 **Food Catalog** — category browsing, full-text search, filters (category, veg/non-veg, price), sorting, pagination
- 🍽️ **Food Detail** — nutrition facts, ingredients, allergens, ratings, reviews, related items
- ❤️ **Wishlist** — save favorites, persisted per user
- 🛒 **Cart** — persistent cart, quantity controls
- 🎟️ **Coupons** — percentage/fixed discounts, min-order & usage limits
- 💳 **Checkout** — delivery address management, COD (fully working) + Razorpay/Stripe gateway integration point
- 🚚 **Order Tracking** — live status timeline, invoice/payment summary, cancellations & refunds

### Admin Dashboard
- 📊 Analytics: revenue, order counts, top-selling foods, 30-day revenue chart
- 🍔 Food management (CRUD + stock), categories, coupons
- 📦 Order management — status progression, delivery assignment, refunds
- 👥 Customer & role management, review moderation, store settings (delivery charges, tax, payment toggles)

### Delivery Partner Dashboard
- 🛵 Assigned deliveries, OTP-verified delivery completion, earnings tracking, order status updates

### Platform
- 🎨 Modern, premium, mobile-first UI with **dark/light mode**, skeleton loaders, smooth animations, responsive layout
- 🔒 Security: Helmet, CORS, rate limiting, mongo-sanitize, bcrypt, validation (zod), cookie hardening
- 🧩 Modular, clean architecture with separation of concerns

## 🏗️ Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Zustand, React Router, Axios, react-hot-toast
- **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, zod, helmet, express-rate-limit, winston, nodemailer
- **Database:** MongoDB

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

### 1. Install dependencies
```bash
npm run setup
```

### 2. Configure environment
- Copy `server/.env.example` to `server/.env` and set your `MONGODB_URI`, JWT secrets, etc.
- (Optional) `client/.env` with `VITE_API_URL=/api` (default uses Vite proxy).

### 3. Seed demo data
```bash
npm run seed
```

### 4. Run both servers (development)
```bash
npm run dev
```
- Client: http://localhost:5173
- API: http://localhost:5000 (health: `/health`)

Or run separately:
```bash
npm run dev:server
npm run dev:client
```

## 🔑 Demo Accounts (seeded)
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@foodhub.com` | `Admin@123` |
| Customer | `user@foodhub.com` | `User@123` |
| Delivery | `delivery@foodhub.com` | `Delivery@123` |

## 📁 Project Structure
```
├── server/                 # Express REST API
│   └── src/
│       ├── config/         # env, logger, database
│       ├── models/         # Mongoose schemas
│       ├── controllers/    # Auth, Food, Order, Admin, User
│       ├── routes/         # API route definitions
│       ├── middlewares/    # auth, validate, error handling
│       ├── services/       # email service
│       ├── utils/          # jwt, cookies, helpers, seeder
│       └── validators/     # zod schemas
└── client/                 # React SPA
    └── src/
        ├── api/            # axios client + service modules
        ├── components/     # ui, layout, food components
        ├── pages/          # all pages (customer/admin/delivery/auth)
        ├── store/          # zustand stores
        └── utils/          # formatting helpers
```

## 🔒 Security Checklist
- ✅ JWT access (short-lived) + refresh token rotation
- ✅ httpOnly, secure, sameSite cookies
- ✅ Helmet security headers, CORS allow-list
- ✅ Rate limiting (global + auth-specific)
- ✅ NoSQL injection protection (express-mongo-sanitize)
- ✅ Input validation (zod) on all endpoints
- ✅ bcrypt password hashing
- ✅ Role-based access control middleware
- ✅ Operational error handling + centralized logger
- ✅ Passwords & tokens never exposed in responses

## 💳 Payments
- **COD** is fully functional out of the box.
- **Razorpay / Stripe** are integrated at the architecture level: the checkout creates a gateway order and returns a `transactionId`, which is confirmed via `POST /api/orders/:id/payment/confirm` after the client-side SDK completes. Set your keys in `server/.env`.

## 📝 License
MIT
