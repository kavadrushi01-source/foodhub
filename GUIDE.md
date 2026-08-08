# 🍔 FoodHub — Quick Use Guide (for me)

Short how-to for using the site: login, OTP, admin, adding products.

---

## 1. Login & Emails

| Area | How | Login (demo) |
|------|-----|--------------|
| Customer | normal sign up / login | `user@foodhub.com` / `User@123` |
| Admin | login → auto-goes to `/admin` | `admin@foodhub.com` / `Admin@123` |
| Delivery | login → auto-goes to `/delivery` | `delivery@foodhub.com` / `Delivery@123` |

- **Emails:** signup sends a **verify email**; "Forgot password" sends a **reset
  email**. In dev, emails show in the terminal log (Ethereal preview link) — no real email goes out.

---

## 2️⃣ Customer — Order in 4 steps

1. Open **Home / Menu** → search or filter → tap a dish.
2. **Add to cart** (set quantity) → open cart.
3. **Checkout** → add a delivery address → pick **COD / UPI / Card**.
4. **Pay & place order** → track in **My Orders** (Pending → Confirmed → Preparing → Out for Delivery → Delivered).

**Coupon:** in the cart, type the code → discount shows instantly.

---

## 3️⃣ Admin — Most-used actions

| Task | Where | How |
|---|---|---|
| **Add product** | `/admin/foods` → **Add Food** | name, price, category, veg dot, photo, stock → Save |
| **Edit / disable** | `/admin/foods` | click edit; toggle stock or availability |
| **Categories** | `/admin/categories` | add/rename/delete |
| **Coupons** | `/admin/coupons` | new code, type (% or flat), min order, expiry, active |
| **Orders** | `/admin/orders` | change status ✅, **assign delivery partner**, **refund** |
| **Users** | `/admin/users` | change role, enable/disable |
| **Settings** | `/admin/settings` | delivery fee, tax %, online-payment toggle |

> New product must fill all required fields — Save error messages tell you what's missing.

---

## 4️⃣ Delivery — OTP flow (important)

1. Your **Today's** list shows assigned orders (customer name + address).
2. Pick up ✅ → mark **Out for Delivery**.
3. At the door, the customer reads a **4-digit OTP** from their order screen.
4. Enter the **OTP** → only then can you close the order as **Delivered**.

> Order **cannot** be completed without the correct OTP — no fake handoffs.

---

## 5️⃣ OTP / Verification summary (chart)

| Trigger | Who gets it | Where it appears | Used for |
|---|---|---|---|
| New signup | customer email | verification link/email | activate account |
| Password reset | customer email | reset link/email | set new password |
| Delivery drop-off | customer | order page shows code | rider enters to finish |

---

## 📍 Quick page map

| Page | Who | What |
|---|---|---|
| **/menu** | customer | search, filter, sort |
| **/cart** | customer | qty, coupon |
| **/checkout** | customer | address + payment |
| **/orders** | customer | track, cancel |
| **/profile** | customer | settings, addresses, own wishlist |
| **/admin** | admin | everything above |
| **/delivery** | rider | pending deliveries, earnings |

---

*That's it — easy. 🚀*