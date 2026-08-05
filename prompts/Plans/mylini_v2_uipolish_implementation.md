# MYLINI v2 — Storefront UX & Mobile Polish — Implementation Plan

## Status: ✅ Executed (all 9 phases) — 2026-07-17

`npx tsc --noEmit`: 0 errors. `npm run build`: passing, all routes present including the new `/api/addresses/[id]`. Dev-server smoke test (curl, no browser tool available in this environment — see caveat below) confirmed `/`, `/shop/girls-traditional`, `/checkout`, `/cart`, `/product/[slug]` all return 200 with the expected new markup ("Save this address", stock/CTA text) and no server errors in the dev log.

**Honest caveats, not swept under the rug:**
- **No real browser/visual verification.** This environment has no `chromium-cli`/Playwright installed, and installing one (browser binary download) was judged out of scope for a verification step. Everything was verified via `tsc`, `next build`, and HTML-level smoke tests, not by actually looking at the rendered page at 360/375/390/412px. **The user should open the dev server and eyeball the four target mobile widths before considering this fully done** — that's the one thing this session could not check itself.
- **ISR fix**: `/` now measurably builds as `○ Static` with `Revalidate 1m` (was `ƒ Dynamic`), proving the `cookies()`-forced-dynamic bug is fixed. `/product/[slug]` and `/shop/[category]` still show `ƒ` in the build table — confirmed via Next's own bundled docs that this is expected for dynamic-segment routes without `generateStaticParams` (on-demand ISR still applies at runtime), not a sign the fix didn't work. Worth double-checking with real traffic/timing if it matters later.
- **"Save this address" checkbox** is implemented as controlling `is_default`, not literally skipping the DB write — `orders.address_id` is a NOT NULL FK, so *some* address row must exist regardless. This was a judgment call flagged in Phase 3 above rather than a schema change; revisit if the user wants different semantics.
- **Phase 7/8 "mobile audit" and "extra polish"** were done as a targeted pass (touch targets, the specific spots this session's own code review turned up), not an exhaustive pixel-by-pixel sweep of every storefront page — see the honesty caveats already in Phases 7–8 below.


Source spec: `prompts/Plans/mylini_v2_uipolish.md`. Architecture, admin, and database are explicitly out of scope except where the spec itself calls for it (perf investigation) or where a fix is purely additive (address list endpoint — no migration needed, `addresses.is_default` already exists).

Constraints carried over from `CLAUDE.md`/`AGENTS.md` that this plan must respect:
- No Supabase calls outside repositories; no top-level import of heavy/Node-only deps into modules reachable from public routes.
- No `SUPABASE_SERVICE_ROLE_KEY` outside `admin.ts`.
- `tsc --noEmit` stays at 0 errors; `npm run build` stays green after every phase.
- Admin functionality untouched.

## Codebase facts gathered before writing this plan

- **Login-callback pattern already exists**: `useAuthStore.openLoginModal(callback)` runs `callback()` right after a successful login (`useAuthStore.ts:38-44`). `useWishStore.toggleItem` already uses this pattern correctly. `ProductDetailClient.handleAddToCart` and `CheckoutPage.handleCheckout` do **not** — cart add has no auth gate at all, and checkout's gate calls `openLoginModal(() => {})`, an empty callback that silently drops the submission after login. Both are bugs relative to the spec, fixable with the existing architecture — no new auth code needed.
- **Stock data** is already fully joined into `ProductWithVariants` (`inventory.stock_available`, `low_stock_threshold`) on the product detail page, but **not** on cart items (`CartRepository`'s `ITEMS_SELECT` omits `inventory` entirely). Adding it is a non-breaking `select()` widening, not a schema change.
- **`addresses` table already has `is_default`** (migration `010_create_addresses.sql`) and migration `031` already grants `authenticated` full `SELECT/INSERT/UPDATE/DELETE` with an owner-only RLS policy (`FOR ALL ... USING (auth.uid() = user_id)`). Only `POST /api/addresses` exists today — `GET`/`PATCH` are missing at the route layer, not the DB layer. No migration needed for the address-book feature.
- **ISR is confirmed broken** (`architectureFiles/systemstatus.md`, discovered same-day as this task): `src/lib/db/server.ts`'s `createClient()` calls `await cookies()`, which forces `/`, `/product/[slug]`, `/shop/[category]` fully dynamic despite `export const revalidate = 60`. Public-read repository methods (`productRepository.findAll/findBySlug`, `categoryRepository.findAll/findTree`, `homepageRepository` reads) use this same cookie-bound client for no reason — they never read a cookie. Swapping them to a cookie-free anon client is the single highest-leverage fix for spec section 3 ("feels slow") and is explicitly in scope ("investigate why homepage/product/category routes still feel slow... without violating existing rules... don't reintroduce the documented rendering issues").
- Design tokens already exist and are used consistently: `--ease`, `--spring` (globals.css), 200–300ms transitions, `FadeImage` blur-in wrapper, Framer Motion already the animation library (no new deps needed).
- Touch targets currently under 44px in the interactive surfaces: Navbar icon buttons (`w-10 h-10` = 40px), product-detail quantity stepper (`w-10 h-10`), cart quantity stepper (`w-8 h-8` = 32px), ProductCard wishlist heart (32px). These need bumping per spec section 4.

## Phase 0 — Perceived performance (do first; touches shared repository code, want it stable before UI work lands on top)

1. New `src/lib/db/publicClient.ts` — cookie-free anon-key client via `createClient` from `@supabase/supabase-js` directly (same package already a dependency). No `cookies()` call, safe to use in a route that must stay static.
2. Swap the **public-read-only** call sites to it (leave every write, admin, and auth-bootstrap call site untouched):
   - `productRepository.ts`: `findAll`, `findBySlug`, `getFilters` (the 3 call sites currently on `createClient()` from `server.ts`).
   - `categoryRepository.ts`: `findAll`, `findTree` (public reads only — its admin write stays on `createAdminClient()`).
   - `homepageRepository.ts`: the public `getByType`/`getByTypes` read path.
3. Verify: `next build` shows `/`, `/product/[slug]`, `/shop/[category]` as `○ Static`/`ISR`, not `ƒ Dynamic`. This is the acceptance test for section 3's "investigate why routes feel slow."
4. Confirm no regression: cart/wishlist/orders/checkout/auth routes still correctly use the cookie-bound or authenticated client (they need per-request identity, unlike public catalog reads).

## Phase 1 — Login-before-purchase gating (spec section 1)

1. `ProductDetailClient.tsx`: wrap `handleAddToCart`'s body in an auth check at the top — `if (!isAuthenticated) { openLoginModal(() => handleAddToCart()); return; }`. Closure captures `selectedVariantId`/`quantity` at click time, so size/qty survive the login round-trip per spec ("DO NOT lose selected size/quantity/variant").
2. `CheckoutPage.tsx`: extract the POST-address/POST-order logic out of the form's `onSubmit` into a standalone `submitOrder()` function; `handleCheckout` becomes `e.preventDefault(); if (!isAuthenticated) { openLoginModal(() => submitOrder()); return; } submitOrder();`. Fixes the existing empty-callback bug so checkout actually resumes after login instead of silently stalling.
3. Wishlist (`useWishStore.toggleItem`) already does this correctly — no change needed, used as the reference pattern.
4. No separate "Buy Now" CTA exists in the current UI (spec lists it as an example purchase action, not a request to add a new button) — not inventing one; out of scope per "Do not redesign, only improve."
5. Small success moment after a post-login auto-add: the existing `justAdded` view-cart bar already covers this ("Small success animation... Remain on same page") — no new component needed.

## Phase 2 — Stock / quantity UX (spec section 2)

**Product detail (primary purchase surface, full inventory data already available):**
1. Quantity stepper: clamp `quantity` state to `[1, stock_available]` instead of the current hardcoded `10`; disable `+` once `quantity === stock_available`.
2. Add the "Only N left" badge (stock ≤ 5) directly above the Add to Cart button (spec-mandated placement), keeping the existing inline stock-status line below the price as-is (both are useful, different positions serve different scan points).
3. `handleAddToCart` catch block: if the thrown error's message/code indicates `INSUFFICIENT_STOCK`, show an inline message under the CTA ("Only {n} pieces are available.") instead of the current generic `toast.error(e.message)` — matches spec's explicit "NOT 'Insufficient stock'" instruction. Sync `quantity` down to the real `stock_available` from the error context so the stepper can't immediately resubmit the same bad request.
4. Out-of-stock button: currently reuses the clay-deep button at `opacity-60` — change to an explicit grey disabled style (`bg-surface-2 text-text-light`) distinct from the "adding…" transient disabled state, per spec ("Grey button. No popup. No toast.").

**Cart page (secondary surface — needs inventory data added first):**
5. `CartRepository.ITEMS_SELECT`: add `inventory(stock_available, low_stock_threshold)` to the variant join (mirrors the exact fields `productRepository` already selects — same shape, no schema change). Update `CartItem`'s `variant` type in `src/types/cart.ts` to include it.
6. Cart quantity stepper: clamp to `stock_available`, disable `+` at cap, and on an `INSUFFICIENT_STOCK` update error show the same friendly inline copy instead of the raw error toast.

## Phase 3 — Save-address / address book at checkout (spec section 6)

Backend (additive only, no migration — see facts above):
1. `UserRepository`: add `findAddressesByUserId(userId)` and `updateAddress(id, userId, patch)` (ownership-checked via the authenticated client + existing RLS policy as defense-in-depth).
2. `addressSchema.ts`: add an `updateAddressSchema` (partial, no `user_id` in body — taken from session).
3. Routes: `GET /api/addresses` (list, `requireSession`) and `PATCH /api/addresses/[id]` (update/set-default, `requireSession`).

Frontend (`CheckoutPage.tsx`):
4. On mount, if authenticated, fetch the address list. If any exist: show them as selectable cards (name/line1/city/pincode), the `is_default` one preselected, plus an "＋ Add new address" option that reveals the existing form. Selecting an existing address **reuses its id** for order creation — no new row created (satisfies "do NOT duplicate addresses").
5. "＋ Add new" path keeps the current form fields and adds a `☑ Save this address` checkbox, default checked. Checked → POST creates the address and (if it's the user's first, or explicitly chosen) sets `is_default: true`, exactly like today's always-save behavior. Unchecked → still creates the row (the `orders.address_id` FK requires *a* row to exist — this is standard e-commerce practice, not a workaround) but leaves `is_default: false` so it won't be preselected or prioritized next time. This interpretation avoids any schema change while still giving the checkbox real, honest effect (default-preselection behavior) — flagging this explicitly since the spec didn't cover the FK constraint.
6. "Edit existing" → inline-editable selected card, `PATCH`es on save.
7. Guest/first-time checkout (no saved addresses) behaves exactly as today.

## Phase 4 — Navigation additions (spec section 5)

1. `MobileDrawer.tsx`: add a `Logout` action in the authenticated block (calls `useAuthStore.logout()` then closes the drawer + redirects home, mirroring `AccountPage.handleLogout`). Wishlist is already an unconditional link in the drawer — leave as is.
2. `Navbar.tsx`: add a small "My Orders" icon/link next to the existing account icon, `isAuthenticated`-gated only (one added icon, not a redesign — spec explicitly asks for orders quick-access while also saying "do NOT clutter navbar").

## Phase 5 — Offer strip mobile (spec section 7)

1. `OfferStrip.tsx`: add `snap-x snap-mandatory scroll-smooth` + `overscrollBehaviorX: contain` / `WebkitOverflowScrolling: touch` (same pattern already used for the mobile product gallery and related-products row — consistent codebase idiom, not a new pattern). Give each card `snap-center` and narrow mobile width from full-`calc(100vw-2rem)` to `~86vw` so the next card peeks at the edge (the "Apple Wallet" affordance the spec asks for), without changing card content/styling.

## Phase 6 — Hero banner mobile proportions (spec section 8)

1. `HeroBanner.tsx`: reduce mobile-only vertical padding/margins (`p-7` → tighter mobile value, `mb-3.5`/`mb-2.5`/`mb-5` trimmed slightly on mobile via responsive classes) and cap mobile height in the `50–65vh` band via a mobile-only `min-h`/`max-h` pair, leaving the `md:` desktop styles untouched. No structural/grid changes — proportions only, per spec ("Redesign proportions only. Keep same style.").

## Phase 7 — Mobile-first pass (spec section 4) + loading skeletons (part of section 3)

Targeted, not a full rewrite (spec says "only improve," and an exhaustive per-pixel audit of every page is not realistically verifiable in one pass — flagging this honestly rather than overclaiming):
1. Bump the sub-44px touch targets identified above to 44px: Navbar icon buttons, product-detail & cart quantity steppers, ProductCard wishlist heart button.
2. Add `src/app/(storefront)/loading.tsx` (home) using the same skeleton idiom as the existing `shop/[category]/loading.tsx`/`product/[slug]/loading.tsx`, to close the one real gap in loading-skeleton coverage for a high-traffic route.
3. Spot-check checkout's 2-column grid and hero/offer-strip at 360/375/390/412px for overflow; fix anything that actually clips (can't enumerate in advance — verified during execution, not predicted here).

## Phase 8 — Extra polish (spec, "EXTRA POLISH" section)

Best-effort, applied opportunistically while touching the files above (not a separate exhaustive sweep — same honesty caveat as Phase 7). Anything notable found gets fixed inline and called out in the final summary.

## Verification after every phase

`npx tsc --noEmit` (must stay 0 errors) — after Phase 0 and again at the end, `npm run build` (confirms the ISR fix actually changes route types in the build output, and that nothing else broke). No new console warnings, no new libraries added.
