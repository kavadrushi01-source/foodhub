# 🌐 How to Use the Live FoodHub Website

Everything you need to try the deployed site — **no setup, no install, no API keys.**

| What | Where |
|------|-------|
| **Website** | <https://foodhub-seven-gules.vercel.app> |
| **Admin panel** | <https://foodhub-seven-gules.vercel.app/admin> |
| **API** | <https://foodhub-pearl-tau.vercel.app> |

---

## 1. Sign in

Go to **<https://foodhub-seven-gules.vercel.app/login>** and use any demo account:

| Role | Email | Password | What you get |
|------|-------|----------|--------------|
| **Admin** | `admin@foodhub.com` | `Admin@123` | Full admin dashboard at `/admin` |
| **Customer** | `user@foodhub.com` | `User@123` | Normal shopping: cart, checkout, orders |
| **Delivery** | `delivery@foodhub.com` | `Delivery@123` | Delivery-partner app at `/delivery` |

You can also **Sign in with Google** using any real Google account — it creates a
customer account automatically.

> ⚠️ These are **shared demo credentials** on a public deployment. Don't enter real
> personal or card details, and don't change the admin password if you just want to look around.

---

## 2. Place a demo order

1. **Sign in** as `user@foodhub.com`
2. **Menu** → add dishes to the cart
3. **Cart** → apply a coupon, then **Proceed to checkout**
4. On **Checkout** the **New Address** form (with the map) is already open:
   - **Search** a place or **click the map** to drop a pin — the address fills in by itself
   - Complete **label, address, city, state, pincode, phone** → **Save Address**
   - Or press **Cancel** and pick one of your **saved addresses** (the default is pre-selected)
5. Managing saved addresses (all on the Checkout page):
   - **⭐** promotes an address to **default**
   - **🗑** **deletes** it after a confirmation — delete the default one and another address
     becomes the default automatically
   - Saving an address you already have (same text + same map pin) just **selects** it
     instead of creating a duplicate
6. Pick a payment method → **Place Order**
7. Watch the status change under **My Orders**:
   `Pending → Confirmed → Preparing → Out for Delivery → Delivered`
8. While the rider is **Out for Delivery**, open the order to watch them **move live on the
   map** — road route, distance and ETA (free, no Google Maps key needed)

### Demo coupons

| Code | Effect |
|---|---|
| `WELCOME10` | 10% off |
| `FLAT50` | ₹50 off |
| `FOODIE20` | 20% off |

### 💡 First request can take a few seconds

The API is a serverless function that sleeps when idle. The **first** request after a
quiet period takes **3–6 seconds** to wake up. This is normal — just wait, don't refresh.
Everything after that is fast.

---

## 3. Test card payment (test mode — no real money)

The site runs Razorpay in **TEST MODE**. No real money moves, and a real card is never
charged. Use these fake details:

| Field | Enter this |
|---|---|
| **Card number** | `5267 3181 8797 5449` |
| **Expiry date** | `12 / 30` (any future date) |
| **CVV** | `123` (any 3 digits) |
| **Card name** | `John Doe` (any name) |

### Then handle the OTP screen

Razorpay shows a *"Securely saving your card"* screen and asks for an OTP.
**No real OTP is sent anywhere.** Do either of these:

1. Click **Skip OTP** (bottom-left) — fastest, or
2. Type **any 6-digit number** (e.g. `123456`) → click **Continue / Confirm**

> 💡 Tick **"Save this card securely for future payments"**? Leave it **unticked** — that
> checkbox is what brings up the OTP screen in the first place.

### ⚠️ If the payment fails

You'll see one of these:

| Message | Meaning |
|---|---|
| *"Too many failed OTP verification attempts"* | The card got locked after bad OTPs |
| *"International cards are not supported"* | Same lockout — misleading, your card is fine |
| *"Please enter a valid card number"* | A typo in the card number |

**Fix:** wait about a minute, then try again with a different test card.

### More test cards

| Card number | Type |
|---|---|
| `5267 3181 8797 5449` | Mastercard (domestic) ✅ works |
| `4111 1111 1111 1111` | Visa (domestic) ✅ works |
| `5555 5555 5555 4444` | Mastercard (international) |

Always: any future expiry, any CVV, any name.


---

## 4. ⚡ Fastest way to test payment — use Netbanking

**Skip the card + OTP entirely.** Netbanking is the quickest payment to demo:

1. At **Checkout**, choose **Netbanking** (or leave **Razorpay** selected, then pick
   Netbanking inside the modal)
2. Pick **any bank** from the list — the bank details don't matter
3. Razorpay shows a **mock bank page** with two buttons:
   - **Success** → payment completes
   - **Failure** → payment fails, so you can test the failure path too

**No OTP, no card number, no real bank login.** The same mock page works for
**Wallets** — pick any wallet, then Success or Failure.

### Payment methods at a glance

| Method | How to test | Speed |
|---|---|---|
| **Netbanking** | Any bank → mock page → **Success** | ⚡ **Fastest** |
| **Wallet** | Any wallet → mock page → **Success** | ⚡ Fast |
| **Cash on Delivery** | No gateway at all — order completes instantly | ⚡ Fastest |
| **Card** | Test card + Skip OTP | Medium |
| **UPI** | `success@razorpay` / `failure@razorpay` | Medium |

---

## 5. Test UPI

Choose **UPI** at checkout and enter:

| UPI ID | Result |
|---|---|
| `success@razorpay` | ✅ Payment succeeds |
| `failure@razorpay` | ❌ Payment fails |

On **mobile**, choosing UPI can open Google Pay / PhonePe / Paytm directly (UPI intent).

---

## 6. Use the admin panel

Sign in as `admin@foodhub.com` → you're taken to `/admin` automatically.

| Section | What you can do |
|---|---|
| **Overview** | Revenue, order counts, top-selling foods, charts |
| **Foods** | Add / edit / delete dishes, prices, stock, images, veg flag |
| **Categories** | Add / rename / delete menu categories |
| **Orders** | Update status, assign a delivery partner, issue refunds |
| **Coupons** | Create discount codes |
| **Users** | List users, change roles, activate/deactivate |
| **Reviews** | View and delete reviews |
| **Settings** | Delivery charge, tax, payment toggles, contact details |

**Try the full flow:** place a customer order → open **Orders** in the admin panel →
change its status → assign it to `delivery@foodhub.com` → sign in as the delivery
partner to see it and complete the drop-off with the OTP.

Order status moves: `Pending → Confirmed → Preparing → Out for Delivery → Delivered`.

---

## 7. Delivery partner view

Sign in as `delivery@foodhub.com` → `/delivery`. Shows assigned pickups and drop-offs,
lets you update status at each leg, and confirm hand-off with the OTP given by the admin.

---

## 8. Other things to try

- **AI chatbot "Foodie"** — the orange button at the bottom-right of every page. Ask
  *"how do I place an order?"*, *"what payment methods?"*, *"do you have veg options?"*,
  or even *"what is 100-20?"*
- **Wishlist** — star any dish on the menu, then find it under Profile
- **Google sign-in** — works with any real Google account
- **Reviews** — rate a dish after ordering
- **Dark mode** — toggle in the navbar

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Page spins, then loads | Cold start — wait 5s, don't refresh |
| *"Invalid email or password"* | Use the exact demo credentials from section 1 |
| Payment modal won't open | Hard-refresh with **Ctrl+Shift+R**; disable ad-blockers |
| *"International cards are not supported"* | Card lockout — wait a minute, use another test card |
| Order stays *pending* after paying | Open **My Orders** → **Retry payment** |

---

> 🔧 Want to run this locally or deploy your own copy? See
> [DEPLOYMENT.md](./DEPLOYMENT.md) for environment variables and setup.
> 📘 Looking for the admin panel in depth? See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).
