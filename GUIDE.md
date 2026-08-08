# 🍔 FoodHub — My Food-Delivery Website
### A simple, easy-language guide for my non-technical friends

---

## What is this?

I built my own **food-delivery website** — like the apps you already use, but I
made the whole thing myself. Here is what it does:

- You open the site, look at photos of food, tap **Add to cart**, and place an order.
- You can track the order all the way to your door, cancel it, use a discount code, and pay by **Cash on Delivery**, **UPI**, or **card**.
- There is a little **AI assistant** called *Foodie* on every page — you type a
  question and it answers instantly (menus, delivery, payments, even jokes!). 😄
- The **shop owner** gets a secret control room where they can see all orders,
  add new food, update items, and check how much the shop is earning.
- The **delivery rider** gets their own app showing which order to pick up and
  where to take it.

---

## The three "worlds" inside the site

| World | For whom | What they do |
|-------|----------|--------------|
| 🌆 **Customer** | People ordering | Browse food, cart, checkout, track, coupons, reviews, chat with Foodie |
| 🧑‍💼 **Admin/Owner** | The shop owner | Dashboard with charts, add/edit food, manage orders, coupons, users, settings |
| 🛵 **Delivery Rider** | Couriers | Get-assigned deliveries, mark each step, enter the customer's secret code (OTP) to complete |

A special secret code (OTP) is given to the customer when the rider arrives — so
deliveries can only be closed by genuine riders. That's a small detail but makes
the system honest.

---

## How the website is made — in everyday language

Think of the website as a restaurant made from . . .

1. **The Storeroom** 😕 → where all information lives (food items, orders,
   customers). Technically called the **database** (MongoDB).
2. **The Kitchen** 👨 – the "brains" part that follows all the rules — who can
   log in, how an order is built, whether a coupon is valid, whether the payment
   is real. This is called the **server / backend** (Node.js + Express).
3. **The Dining Room / Front Desk** — everything you click and see — the
   photos, buttons, pages. This is called the **frontend** (React).
   *(Bonus: nothing visual happens without the kitchen's permission!)*

When you log in, the "front desk" asks the "kitchen", the kitchen checks the
"storeroom", and if everything is right the kitchen gives you a special *card*
(token) that proves who you are for a while — and tells which room (customer /
owner / rider) you're allowed into.

---

## The owner and rider are not in the same room

Every person gets a **role** when they sign in, and the server checks that role at
every door ("Prohibited!"). So a customer can't open the owner control room, and a
rider can't change the menu. It's exactly like an office building with ID badges.

---

## Things I had to be extra careful about

- **Making it look good** — buttons, colors, animations, dark mode, loading screens.
- **Making it "mobile first"** — so it's as beautiful on a phone as on a computer.
- **Making it safe**:
  - Passwords are stored *scrambled* (nobody — not even the owner — can read them).
  - Bank/Gateway secret keys (real Razorpay) live only in the secret server
    settings on Render — never in the public code.
  - There are **rate controls** — if someone tries to break in a million times, the
    site says "slow down".

---

## 🐛 Bugs I fixed along the way (in simple words)

1. **Signup worked in the logic but broke in the browser** → it was a Cross-Origin
   rule (a browser security rule). I allowed my site's address properly and it healed.
2. **Checkout appeared empty** → a cart drawer that stayed "in front" and a code invention
   about how the answer was wrapped. Fixed by closing the drawer + reading correctly.
3. **The AI "Foodie" said "Auth required" to regular people** → a middleware rule
   was accidentally blocking the guest chatbot. Moved the order of code — now it works for everyone.
4. **Site sometimes broke "duplicate food items"** → the seed (the script that adds
   starter demo data) now cleans duplicates each run.

---

## 🌍 Where a website lives (how I put it online)

| Part | Where | Live URL |
|------|-------|----------|
| Website you load (frontend) | **Vercel** | foodhub-seven-gules.vercel.app |
| The "kitchen" logic (API) | **Render** | foodhub-api-u3oy.onrender.com |
| The storeroom (database) | **MongoDB Atlas** | cloud database |
| Payments | **Razorpay** (live) | UPI / cards / COD |
| Email service | **Resend** | verification & reset emails |

When I change the code and push to **GitHub**, the two online services notice
automatically and redeploy the site — I don't even have to press anything.

---

## 🙋 Why I made this

This started as a **learning project** — to understand how real food apps (Zomato,
Swiggy, Blinkit) actually work, from the idea all the way to "it's live!".
No shortcuts — I built each piece with my own hands: the pages, the delivery
logic, the dashboard, and even the little AI friend.

If you ever want to build your own app like this, the exact step-by-step path I
took is in `docs/how-i-built-this/` in this repo — but this file is the
friend-friendly "explain it like I'm five" version. 😉

---

*Questions? Just ask — you'll get a straight, non-techie answer.* 🚀