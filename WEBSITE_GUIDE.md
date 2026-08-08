# 🍔 FoodHub — Website & User Guide

This guide explains **how the website works and how to use it** — as a customer,
as a delivery partner, and as the admin.

---

## 0. Live Website

> 🚀 **The live site is deployed** — no need to run it locally to try it.

| What | Where |
|------|-------|
| **Website (frontend)** | <https://foodhub-seven-gules.vercel.app> |
| **API (backend)** | <https://foodhub-api-u3oy.onrender.com> |
| API health check | <https://foodhub-api-u3oy.onrender.com/health> |

- The **frontend** is hosted on **Vercel**, the **backend API** on **Render** (free tier —
  it may take a few seconds to wake up after being idle).
- All demo credentials below work on the live site too.

For **local development** (after following *Getting Started* in the README), the site
runs at `http://localhost:5173` with the API on `http://localhost:5000`.

---

## 1. What this site does in one line

FoodHub is an online **food ordering + delivery management** platform: customers
browse a menu, add food to a cart, apply coupons, check out (COD / UPI / Razorpay),
track orders and leave reviews — while **admins** manage everything and **delivery
partners** fulfill orders with OTP-verified drop-offs. A built-in **AI chatbot**("Foodie")
answers questions instantly on any page.

---

## 2. Accounts & Roles

| Role | Email | Password | What you get |
|------|-------|----------|--------------|
| Admin | `admin@foodhub.com` | `Admin@123` | `/admin` dashboard after login |
| Customer | `user@foodhub.com` | `User@123` | normal shopping experience |
| Delivery | `delivery@foodhub.com` | `Delivery@123` | delivery-partner app |

The site sends you to your correct area after login based on your role
("role-based redirect"). New registrations are **customer** by default.

---

## 3. Customer — Every Screen Explained

### Home (`/`)
- Animated **offer ticker** (free delivery on online payments, new dishes…).
- **Hero section** with a search box — type a dish name and press search to go to the menu.
- **Featured / bestseller** dishes (cards with photos, price, veg/non-veg dot, rating).
- **Category cards** — click to browse that category on the Menu.
- **How it works** strip — search → order → enjoy.
- **"Why FoodHub"** trust section and a newsletter CTA.

### Menu (`/menu`)
- **Search box** (full-text across dish names/descriptions).
- **Category chips** filter; **veg/non-veg toggle**; **sort** by popularity / price / rating; **pagination**.
- Each dish card → tap opens **Food Detail**.

### Food Detail (`/food/:slug`)
- Full description, ingredients, allergens, **nutrition facts**, prep time, rating & **reviews**.
- **Add to cart** (choose quantity), **toggle wishlist**, see **related dishes**.
- Submit a review (own purchase recommended), mark reviews helpful.

### Cart (`/cart`)
- Add / remove / update quantities, see itemised totals (price × qty).
- Enter a **coupon code** to see the discount instantly.
- **Proceed to checkout**.

### Checkout (`/checkout`)
- Pick or add a **delivery address** (label, line1/line2, city, state, pincode, phone).
- Choose an address as **default**.
- **Payment method**: Cash on Delivery (recommended for demo; no keys needed) or
  Razorpay/UPI if keys are configured. Online payment qualifies for **free delivery**.
- Review order summary (subtotal, delivery charge, tax, coupon, grand total) and **Place Order**.

### My Orders (`/orders`) & Order Detail (`/orders/:id`)
- Live status timeline: **Pending → Confirmed → Preparing → Out for Delivery → Delivered**.
- **Cancel order** button while it is still Pending/Confirmed (online payments auto-refund).
- Invoice line items, delivery address, payment total.

### My Account (`/profile`)
- Update name/phone/avatar, **change password**, manage **addresses**.
- **Wishlist** — items you starred.

### AI Chatbot 💬 (every page, bottom-right)
- Tap the floating **orange button** → chat window opens.
- Ask anything: *"how do I place an order?", "is delivery free?", "track my order?",
  "what payment methods?", "apply a coupon", "do you have veg options?"* — plus small talk,
  jokes and even math (*"what is 100-20?"*).
- Tap suggested **chips** under messages, or open the **? (FAQ)** panel to browse
  full answers by topic.
- History is saved between visits (clear with the 🗑 button in the header).

---

## 4. Admin Dashboard (`/admin`)

| Page | What you can do |
|------|-----------------|
| **Overview** | Revenue, order counts, top-selling foods, category stats (charts) |
| **Foods** | Create / edit / delete dishes, manage **stock**, photos, veg flag, prices |
| **Categories** | Add / rename / delete categories |
| **Coupons** | Create codes (percent/flat), min-order, usage limits, activate/deactivate |
| **Orders** | See every order, progress status (✅), **assign a delivery partner**, issue **refunds** |
| **Users** | List customers/delivery, change role, enable/disable accounts |
| **Reviews** | Moderate (view / delete) submitted reviews |
| **Settings** | Store-level: delivery charge, tax %, online-payment toggles |

The sidebar groups these; every admin action updates the store instantly.

---

## 5. Delivery Partner App (`/delivery`)

- **Dashboard** — your assigned deliveries with pickup/address items.
- Open an order → **mark status** at each leg (Picked Up → Out for Delivery…).
- At drop-off the customer gets a **4-digit OTP** — you enter the correct OTP to
  complete the delivery (**OTP-verified completion**, no fake handoffs).
- **Orders detail** screen shows item list, customer address and phone.
- **Earnings** shows your payout balance.

Demo login uses the *delivery@foodhub.com* demo account in the main app;

---

## 6. FAQ (People ask)

**Q: Why is delivery free?** — Free delivery when you pay online; otherwise a delivery fee (setting in admin → Settings) is added.

**Q: My coupon isn't working** — Check it's still active, respects the min-order, not expired, and has usage left (admin can verify).

**Q: I can't cancel my order** — Only Pending/Confirmed orders can; once Preparing/Out for delivery the rider must complete it.

**Q: Where are Razorpay payments?** — You must add `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` to `server/.env`; until then COD is used. Payments integration & verification code is complete.

**Q: Why is the chatbot saying "I'm not sure"?** — It matches 100+ hand-written intents
  by regex score; you can add new intents in `server/src/utils/chatbotKnowledge.js`.

---

## 7. Useful API Endpoints (for developers)

| Method | Endpoint | Notes |
|--------|----------|-------|
| `POST` | `/api/auth/register` | create customer account + tokens |
| `POST` | `/api/auth/login` | login |
| `POST` | `/api/auth/refresh` | rotate access token |
| `POST` | `/api/auth/logout` | logout |
| `GET` | `/api/foods?category=&isVeg=&sort=&page=` | public catalogue |
| `GET` | `/api/foods/:slug`, `/api/categories` | detail / categories |
| `POST` | `/api/orders/preview` | order totals preview |
| `POST` | `/api/orders` | create order (auth) |
| `GET` | `/api/orders/me` | my orders (auth) |
| `POST` | `/api/orders/coupon/apply` | coupon check |
| `POST` | `/api/chatbot/ask` | AI assistant (public) |
| `/api/admin/*` | | admin-only (role guard) |
| `/api/delivery/*` | | delivery-only (role guard) |

---

## 8. Resetting to a clean state

```bash
# wipe your local DB collections and re-seed
mongosh localhost:27017/foodhub --eval "db.dropDatabase()"
npm run seed
```

*Enjoy your food! 🎉*