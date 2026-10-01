# 🔐 FoodHub — Admin Panel Guide

Complete reference for the **admin dashboard**: how to get in, what every screen does,
and how to test online payments without spending real money.

> ⚠️ **The credentials below are for a demo/portfolio deployment.** If you have forked
> this project, change the admin password immediately (see *Changing the password*).

---

## 1. Signing in to the admin panel

| What | Value |
|------|-------|
| **Live site** | <https://foodhub-seven-gules.vercel.app> |
| **Admin panel** | <https://foodhub-seven-gules.vercel.app/admin> |
| **Email** | `admin@foodhub.com` |
| **Password** | `Admin@123` |

### Step-by-step

1. Open <https://foodhub-seven-gules.vercel.app/login>
2. Enter the email and password above → **Sign in**
3. You are redirected to **`/admin`** automatically (role-based redirect)
4. You can also reach the panel any time from the profile menu → **Admin Panel**

### If you land on the home page instead

The redirect only fires for accounts whose role is exactly `admin`. If you were
previously a customer, an admin must promote you:

**Admin Panel → Users → find the account → Role → `admin`**

### Common login problems

| Symptom | Cause | Fix |
|---|---|---|
| *"Invalid email or password"* | Password was changed | Use the current password, or reset via **Profile → Change Password** |
| Redirects to `/` not `/admin` | Account is not an admin | Ask an admin to set your role to `admin` |
| *"Please verify your email"* | Seeded accounts are pre-verified; new signups are not | Click the resend link, or an admin can activate the account |
| Page stays blank / spinner | The API is a serverless function and was idle | Wait ~5s — the first request wakes it up (see *Cold starts* below) |

### Changing the password

**Profile → Security → Change Password** (needs your current password), or ask an
admin to reset it. Password rules: minimum 8 characters, with an uppercase letter,
a lowercase letter and a number.

---

## 2. What the admin can do

Nine sections, all under `/admin`:

| Section | Route | What it does |
|---|---|---|
| **Dashboard** | `/admin` | Revenue, order counts, top-selling items, category split, recent orders |
| **Foods** | `/admin/foods` | Full CRUD on dishes — name, price, discount, stock, veg/non-veg, image, category |
| **Categories** | `/admin/categories` | Add/rename/reorder/delete menu categories |
| **Orders** | `/admin/orders` | See every order, update status, update per-item status, assign a delivery partner, refund |
| **Coupons** | `/admin/coupons` | Create discount codes with limits and expiry |
| **Users** | `/admin/users` | List users, change roles, activate/deactivate an account |
| **Reviews** | `/admin/reviews` | Moderate reviews, delete inappropriate ones |
| **Settings** | `/admin/settings` | Delivery charges, free-delivery threshold, payment toggles, contact details |

### Order status pipeline

```
pending  →  confirmed  →  preparing  →  out_for_delivery  →  delivered
                                                      ↘  cancelled / refunded

---

## 3. Testing online payments (Razorpay test mode)

The site runs Razorpay in **TEST MODE ONLY** — the server *refuses* live keys, so no
real money can ever be charged. Payments are simulated.

### Test card that works

| Field | Value |
|---|---|
| **Card number** | **`5267 3181 8797 5449`** (Mastercard, domestic) |
| Expiry | any future date, e.g. `12/30` |
| CVV | any 3 digits, e.g. `123` |
| Name | anything, e.g. `John Doe` |

Also valid: **`4111 1111 1111 1111`** (Visa, domestic).

### ⚡ Fastest way to demo a payment: Netbanking

Skip the card and OTP entirely — pick **Netbanking**, choose **any bank**, and Razorpay
shows a mock page with **Success** / **Failure** buttons. No OTP, no card number, no real
bank login. **Wallets** work the same way.

See **[HOW_TO_USE.md](./HOW_TO_USE.md)** for the full walkthrough.

### The OTP step — read this, it trips everyone up

1. Razorpay shows a **"Securely saving your card"** screen and asks for an OTP.
2. **No real OTP is ever sent.** Enter **any 4–10 digit number** — e.g. `123456`.
   Razorpay accepts any random OTP of that length.
3. Or click **Skip OTP** at the bottom-left to skip the step entirely.

⚠️ Two traps:
- An OTP **shorter than 4 digits** is treated as a failure.
- After ~3 wrong OTPs Razorpay **locks the card** and shows
  *"Too many failed OTP verification attempts"*, or a misleading
  *"International cards are not supported"* — even for a normal domestic Visa.
  **Wait a minute and use a different test card.**

**Also untick "Save this card securely for future payments"** — ticking it is what
triggers the OTP screen in the first place.

### Testing UPI

| UPI ID | Result |
|---|---|
| `success@razorpay` | ✅ payment succeeds |
| `failure@razorpay` | ❌ payment fails |

### Other payment methods

| Method | How to test |
|---|---|
| **Netbanking** | Pick any bank → mock page with **Success** / **Failure** buttons |
| **Wallet** | Pick any wallet → mock page with **Success** / **Failure** buttons |
| **Card** | See above |
| **Cash on Delivery** | No gateway needed — place the order and it completes immediately |

### If payment still fails

1. Open the order in **My Orders** and click **Retry payment** — this issues a fresh
   gateway order, so a failed attempt never blocks you.
2. Failed attempts leave the order in `failed` payment status; it is **not** lost.

---

## 4. Cold starts — why the first request is slow

Both projects are on **Vercel's free tier**, so the API is a **serverless function**
that scales to zero when idle. The very first request after a quiet period takes
**3–6 seconds** while the function boots and connects to MongoDB Atlas; later
requests are ~50–250 ms.

This is normal and not a bug. The API and the web client both retry automatically,
so the page recovers on its own — a manual refresh is never required.

---

## 5. Security notes

- **Change the demo password** before using this for anything real.
- Razorpay **test keys only** — live keys are actively refused by the server
  (`rzp_live_…` is detected and blocked, logged as `razorpayLiveBlocked`).
- Never commit `.env` files. Both projects have a `.vercelignore` so local
  `node_modules/`, logs and env files are excluded from Vercel uploads.
- Admin routes are protected server-side by role, not just hidden in the UI — a
  non-admin calling `/api/admin/*` gets **403**.

```

Status is tracked **per item**, and the order status is derived from its items — so a
two-dish order can be *delivered* for one dish while the other is still *preparing*.

### Assigning delivery

**Orders → pick an order → Assign delivery** → choose an online partner. The partner
sees it under **Delivery → Orders**, updates the status, and confirms the drop-off
with an **OTP** generated by the admin.
