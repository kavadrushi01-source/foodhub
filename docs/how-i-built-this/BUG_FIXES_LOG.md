# 🐛 FoodHub Bug-Fix Log

Every bug we actually hit, the root cause, and the fix — kept as a trail of
"how you debug a real MERN app."

---

## 1. Address schema missing `_id` (CRITICAL)

- **Symptom:** fresh addresses couldn't be referenced/rendered as saved addresses.
- **Cause:** the address subdoc route was returning/serializing without a stable `_id`.
- **Fix:** ensure the embedded address document gets its own `_id` on the schema so
  checkout and the address list can key/update/delete reliably.
- **Lesson:** every document/subdocument you target later by id needs an `_id`.

## 2. Food model virtuals broken with `.lean()`

- **Symptom:** `rating` / `ratingCount` computed values disappeared from food detail.
- **Cause:** Mongoose **virtuals don't run on plain JS objects** from `.lean()`.
- **Fix:** stop using `.lean()` for queries that need virtuals, or populate the
  virtuals explicitly on the lean result.
- **Lesson:** `.lean()` is fast but strips model magic — know what you give up.

## 3. Checkout / CartDrawer bugs (session 02)

- **Symptom:** checkout looked *blank*, and the cart drawer overlay got "stuck".
- **Root causes:**
  1. **Axios response interceptor unwrapping** — pages were reading the response at the
     wrong depth (one level of `.data` too many/too few).
  2. **CartDrawer overlay not closing** before navigating to Checkout.
  3. **No loading states** — a fetch in flight meant a blank page.
  4. **Silent error handling** — failures printed to console, nothing on screen.
- **Fixes:** `client/src/components/layout/CartDrawer.jsx` (close on navigate),
  `client/src/pages/Checkout.jsx` (standards for response reading `res.data.data...`,
  loading spinners, error toasts).
- **Lesson:** standardize how your API responses look and document it, or every
  page re-invents (and mis-reads) the shape.

## 4. Registration failing in browser (CORS)

- **Symptom:** registration POST failed from the SPA with a CORS error while
  Postman/curl worked fine.
- **Cause:** CORS allowed origin list didn't match the browser's origin.
- **Fix:** widened the allowed origins (dev: localhost, prod: the real client URL);
  restarted server; verified headers + health check.
- **Lesson:** "works in Postman, fails in browser" is almost always CORS — the
  browser enforces it, Postman doesn't.

## 5. AI chatbot returning 401 for guests (found 2026-08-08)

- **Symptom:** `POST /api/chatbot/ask` answered "Authentication required" for
  anonymous users — the chat widget on the public pages would break for guests.
- **Root cause:** Express route ordering. `app.js` mounted the *food* router at
  `/api` before the chatbot router, and `foodRoutes.js` has a blanket
  `router.use(protect)`. Any later-mounted public route was silently auth-gated first.
- **Fix:** mounted `/api/chatbot` **before** `/api` food routes so the public engine
  is reachable; all other routers (admin/delivery/orders/payments) are auth-gated
  on their own, so nothing else changed.
- **Lesson:** **middleware ordering matters.** An early `router.use()` affects every
  route mounted after it, even in other routers.

## 6. Chatbot intent mismatches (small, fun)

- **Cause:** regex intents that were too loose or too strict.
  - "apply a coupon" matched the coupon *list* intent instead of the coupon *apply* intent.
  - "what is 100-20" didn't go to math.
  - "store timings" (missing 'timings' word) hit the fallback.
- **Fixes:** coupon-list regex got a negative lookahead for `apply/use/enter`;
  the math solver strips "what is / calculate / solve" prefixes and strips varied;
  hours regex gained `timings?`.
- **Lesson:** test intent phrasing variants aggressively; prefer a couple of
  specific intents over one loose mega-regex.

## 7. Chat widget stacking (UI bug)

- **Symptom:** the floating chat button appeared *above* the cart drawer / mobile
  menu overlays (they share the sample-level `z-50`).
- **Fix:** chat layer moved between the sticky navbar and overlay at `z-[45]`.
- **Lesson:** define a z-index hierarchy (navbar < floating widgets < modals) and
  write it down so new UI doesn't fight with it.

## 8. Seed script growing duplicate dishes

- **Symptom:** re-running the seeder duplicated auto-slugged "clone" dishes.
- **Fix:** seed sync maps category fields, dedupes slug clones, and logs
  `+N` added / `+N removed` on each run.
- **Lesson:** make **seed scripts idempotent** (safe to run many times).

---

## How I "fixed" things without breaking things

1. Reproduce with the smallest failing request/route.
2. Add an assertion/test that fails (I ran `test-full-suite.js` / an auth smoke
   test, then deleted the scripts before pushing so the repo stays clean).
3. Fix, then re-run the whole suite (End-to-End: register → checkout → admin/delivery)
   until green.
4. `node --check` every server file, `npm run lint` + `npm run build` every client.
5. Keep the repo clean before shipping: no `.env`, no test scripts, no debug logs.