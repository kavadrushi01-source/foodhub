# 📖 FoodHub — Website User Guide

A complete walkthrough of how everything works, written by role. Read this to run the app, log in, order food, run the store (admin), deliver orders (delivery partner), or chat with the AI assistant.

---

## Table of Contents
1. [Running the website](#1-running-the-website)
2. [Demo accounts](#2-demo-accounts)
3. [Shopping as a customer](#3-shopping-as-a-customer)
4. [The AI chat assistant (Foodie)](#4-the-ai-chat-assistant-foodie)
5. [Admin dashboard](#5-admin-dashboard)
6. [Delivery partner app](#6-delivery-partner-app)
7. [Common tasks / troubleshooting](#7-common-tasks--troubleshooting)

---

## 1. Running the website

**One-time setup**
1. `npm run setup` — installs server + client dependencies.
2. `cp server/.env.example server/.env` and fill in your `MONGODB_URI` and JWT secrets.
3. `npm run seed` — loads demo categories, foods, coupons and demo accounts.
4. `npm run dev` — starts both apps.

**Where to open**
| App | URL |
|-----|-----|
| Website (client) | http://localhost:5173 |
| API (server) | http://localhost:5000 |
| API health check | http://localhost:5000/health |

Use the **bright orange floating button** at the bottom-right of any page to open the **Foodie AI assistant**.

---

## 2. Demo accounts

| Role | Email | Password | What you get |
|------|-------|----------|--------------|
| Admin | `admin@foodhub.com` | `Admin@123` | Dashboard, full store control |
| Customer | `user@foodhub.com` | `User@123` | Normal shopping experience |
| Delivery | `delivery@foodhub.com` | `Delivery@123` | Delivery assignments & earnings |

**Login → your role directs you automatically** to the matching dashboard (customer home, admin dashboard, or delivery app).

---

## 3. Shopping as a customer

**Browse**
- **Home** — featured dishes + "most popular" strip, or search straight from the hero.
- **Menu** — browse by category, use filters (**veg** / **non-veg** / price), sort by price or rating. Every dish shows a **green dot (veg)** or **red dot (non-veg)**.
- **Food detail** — open any dish to see ingredients, allergens, nutrition, prep time, ratings and reviews.

**Order flow**
1. Tap **+ Add** on any dish → go to **Cart** (or open the cart drawer in the navbar).
2. In cart, enter a **coupon code** (see coupons) and review your summary — paying online during checkout gives **free delivery**.
3. Hit **Checkout** → choose or add a **delivery address** → choose payment: **COD**, **UPI** (Google Pay / PhonePe / Paytm), or **Razorpay**.
4. Confirm → you get an **order number** instantly.

**Track & manage orders**
- **My Orders** → open any order → live status timeline: *Pending → Confirmed → Preparing → Out for Delivery → Delivered*.
- Cancel (while Pending/Confirmed) — online payments are auto-refunded.
- Rate dishes and read others' reviews on food detail pages.

**Profile & account**
- Update name/phone, change password, save addresses, manage your wishlist.

---

## 4. The AI chat assistant (Foodie)

The floating **bottom-right button** opens the chat widget. Foodie answers 90+ questions instantly using a built-in rule engine site base — no external API needed.

Examples of things to ask:
- *"How do I place an order?"* → stepped walkthrough
- *"Is delivery free?"* → delivery-policy answer
- *"How do I track my order?"* → tracking walkthrough
- *"How do I apply a coupon?"* → coupon walkthrough
- *"What payment methods are available?"* → payment options
- *"What are the bestsellers?"*, *"Do you have veg options?"*, *"Tell me a joke"*, *"x + y"*, etc.

Widget extras:
- **`?` button** — opens a browsable **FAQ panel** grouped by topic (Ordering, Delivery, Payments, Coupons, Menu, Account). Tap a question to ask it.
- **Conversation history persists** across page reloads (in your browser).
- **Clear chat** — the **trash icon** in the header resets the conversation.

---

## 5. Admin dashboard

Log in as **admin**. The left sidebar has:

- **Dashboard** — revenue, order stats, top-selling foods, 30-day revenue chart, category breakdown.
- **Foods** — add / edit / delete dishes, set price, stock, veg/non-veg, category; images, descriptions (min 10 chars).
- **Categories** — create, rename, archive.
- **Coupons** — create discount codes (%), set min order, limits, active/inactive.
- **Orders** — see every order, walk the status forward (Confirm → Prepare → Out for delivery), assign a **delivery partner**, issue **refunds**, view customer details.
- **Users** — change roles (user/delivery/admin), disable accounts.
- **Reviews** — moderate or delete reviews.
- **Settings** — delivery charges, free-delivery threshold, tax, payment toggle, chatbot tips.

---

## 6. Delivery partner app

Log in as the delivery partner:
- **Today's deliveries** — assigned orders listed with pickup/pack coordinates-style flow.
- Open an order to run its status through **Out for delivery → Delivered**.
- **Verify with OTP** — the customer's delivery OTP shown at handoff to confirm delivery.
- **Earnings** — tracked per order, today vs all-time.

---

## 7. Common tasks / troubleshooting

| Problem | Solution |
|---------|----------|
| Duplicate seed dishes on menu | Re-run `npm run seed` once — the seeder de-dupes auto-slugged clones. |
| Free delivery not applied | Checkout with an **online payment** (COD also works, but the discount applies to online). |
| Chatbot says "couldn't reach the kitchen" | Make sure the server is running on port 5000 and the chat uses `/api/chatbot/ask`. |
| Can't verify email | In dev, email may not physically send if SMTP is unset — the app logs a preview link; or use resend-verification. |
| 401 "Session expired" | Re-login; access tokens are short-lived (15m) and the client refreshes automatically. |
| Payment not active | Add Razorpay keys to `server/.env` (test keys first). COD always works. |
| Menu shows no images | Images are remote URLs in seed data — requires internet. |

For deeper build details, see [`HOW_I_BUILT_THIS.md`](HOW_I_BUILT_THIS.md).