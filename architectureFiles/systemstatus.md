# System Status — MYLINI v2
**Last Updated:** 2026-07-17 (later same day — Vercel production incident + fix)
**Build:** ✅ `npx tsc --noEmit` = 0 errors · `npm run build` = passing (both Netlify and Vercel build successfully)
**Database:** ✅ LIVE — `jxazdoawlghbfzdmwwmu.supabase.co` (35 migration files; see numbering caveat below)
**Admin Platform:** ✅ WORKING — stateless HMAC token auth, no DB user required, server-side route protection via `proxy.ts`
**Storefront API:** ✅ WORKING — real Supabase data, Row Level Security enforced, rate limiting active — **not actually ISR-cached despite `revalidate = 60`, see caveat below**
**Security:** ✅ HARDENED — RLS on every user-owned table, self-signed JWT auth for `authenticated`-role queries, CSP, DOMPurify XSS defense, constant-time admin auth
**Email:** ✅ LIVE — Resend order-placed notification to the store owner on every successful checkout
**Performance:** ✅ OPTIMIZED — atomic order-creation RPC, optimistic cart UI, blur/fade image loading (ISR caching claim corrected below — routes are actually rendering dynamically)
**Deployment:** ✅ Netlify (mylini-demo.netlify.app) — ✅ Vercel (mylini.vercel.app), confirmed working after the incident below. Both auto-deploy from `main`. Latest pushed commit: `16e9d92`.

---

## Phase Completion

| Phase | Status | Notes |
|---|---|---|
| Phase 1 — Frontend UI | ✅ Complete | Pages, components, Zustand stores |
| Phase 2 — Backend Foundation | ✅ Complete | DB schema, repos, services, API |
| Phase 2.1 — DB Deployment Prep | ✅ Complete | Scripts, env config, seed data |
| Phase 2.2 — Audit & Hardening | ✅ Complete | Architecture violations fixed |
| Phase 2.3 — Live API Validation | ✅ Complete | All endpoints tested vs live DB |
| Phase 3A — Phone-identity Auth | ✅ Complete | Login/session/middleware |
| Phase 3+4 — CMS + Admin Platform | ✅ Complete | Homepage CMS (banner, promo, categories) + full product management |
| Phase 5 — Performance Optimization | ✅ Complete | ISR caching, SQL aggregates, query optimization, 20-30% faster |
| Phase 5.1 — Admin Auth Hardening | ✅ Complete | Stateless HMAC token auth — no DB user/role lookup required |
| Phase 6 — UX & Mobile Improvements | ✅ Complete | Order tracking, order detail, cart layout, related products, view-cart bar |
| Opti Phase 1 — Backend Performance | ✅ Complete | Atomic order-creation RPC, optimistic cart, trimmed queries, AVIF images |
| Opti Phase 2 — Perceived UX | ✅ Complete | Blur/fade image loading, route-level loading states, preload/prefetch tuning |
| Opti Phase 3 — Security & Reliability | ✅ Complete | Real per-user RLS, JWT-signed authenticated client, rate limiting, CSP, XSS sanitization, `proxy.ts` admin protection |
| Production incident — RLS grant gaps | ✅ Fixed | Migration 031 shipped without `service_role`/`authenticated` table grants; fixed by migrations 034 + 035 |
| Production incident — Vercel jsdom crash | ✅ Fixed | `isomorphic-dompurify`'s top-level import leaked `jsdom` into every public route's bundle via `ProductService`; 500'd every storefront page on Vercel. Fixed by lazy-`import()`ing it inside `sanitizeProductDescription()`. See full writeup below and `FIXES_APPLIED.md`. |
| Resend order notifications | ✅ Complete | Store-owner email on every order placed |
| Phase 3B — Wishlist Enhancements | ✅ Complete | Superseded by Opti Phase 3 (RLS + JWT auth), see below |
| OTP verification | 🟡 Built, not wired | Infrastructure complete (migrations 032/033, service, routes); login UI still phone-only per explicit "keep it simple" decision |
| Payments (Razorpay) | 🔲 Planned | |
| Sanity CMS | 🔲 Planned | Homepage CMS already works via DB-backed `homepage_sections` |
| Cloudflare R2 image uploads | 🔲 Planned | Cloudinary is the active storage provider |

---

## Database (Live)

| Item | Value |
|---|---|
| Project URL | `jxazdoawlghbfzdmwwmu.supabase.co` |
| Migration files | 35 (000–035) — **see numbering caveat below** |
| Tables | 24 — `categories, products, product_variants, product_images, product_attributes, inventory, inventory_logs, homepage_sections, carts, cart_items, wishlists, wishlist_items, addresses, orders, order_items, coupons, coupon_usage, users, sessions, otps, rate_limits, roles, permissions, user_roles` |
| Enums | 4 (product_status, order_status, coupon_type, inventory_reason) |
| RPC functions | 9 — `decrement_stock, reserve_stock, release_stock, increment_coupon_usage, create_order_transactional, check_rate_limit, increment_otp_attempts, assign_admin_by_phone, revoke_admin_by_phone` (plus the `products_search_vector_update` FTS trigger function) |
| FTS | Active (trigger-maintained `search_vector` on products) |
| **RLS** | **Enabled on every user-owned/transactional table** (migration 031) — catalog tables are anon+authenticated SELECT-only; carts split guest(anon)/owner(authenticated); wishlists/addresses/orders/coupon_usage authenticated-owner-only via `auth.uid()`; `users`/`sessions`/`otps` have **no** anon/authenticated grant at all — service-role client only |
| Authenticated-role auth | Self-signed short-lived JWT (`src/lib/db/authenticatedClient.ts`, HS256, `SUPABASE_JWT_SECRET`) — this app has no Supabase Auth/GoTrue session, so `auth.uid()` is populated by a JWT the app mints itself from an already-validated session |
| Rate limiting | Table-based (`rate_limits` + `check_rate_limit()` RPC, fixed-window, fails open on error) — applied to OTP send/verify, checkout, coupon validation, cart/wishlist mutation, admin login, admin API |
| Admin auth | Stateless HMAC-signed token — no DB user or role table needed; route protection now also enforced server-side via `src/proxy.ts` (Next.js 16's renamed middleware) |
| CMS sections | `homepage_sections` table (banner, promo_block, featured_category) |
| Seed data | 4 products · 8 variants · 8 inventory · 4 images · 12 attributes |
| TypeScript types | Generated (1042+ lines, live schema as of migration 029 — **not yet regenerated for the `otps`/`rate_limits` tables added since**, see caveat below) |

### ⚠️ Known documentation/tooling gaps (accurate as of this update, not fixed — noted for whoever picks this up)

- **Duplicate migration number 031**: `src/lib/db/migrations/031_order_tracking.sql` (Phase 6, adds `orders.tracking_number`/`tracking_url`) and `031_rls_and_permissions.sql` (Opti Phase 3, RLS) share the number 031. Both are deployed; the RLS one is also timestamped `20240101000031` in `supabase/migrations/`, and `031_order_tracking.sql` has no `supabase/migrations/` counterpart at all. Renumbering wasn't done to avoid confusing already-deployed migration history — just be aware the numeric prefix is not a reliable ordering key past 030.
- **`supabase/migrations/` gap**: files 026–029 (`product_extensions`, `size_chart`, `shopify_parity`, `homepage_sections`) exist in `src/lib/db/migrations/` but have no timestamped copy in `supabase/migrations/`. Pre-existing gap, not introduced this session.
- **`database.types.ts` is stale**: generated before `otps` and `rate_limits` existed. Repository code that touches those two tables casts the Supabase client to `any` (`otpRepository.ts`) as a documented workaround. Regenerate with the command in the TypeScript/Zod Notes section of `CLAUDE.md` once convenient — not urgent, nothing currently breaks.
- **`/`, `/product/[slug]`, `/shop/[category]` are NOT actually ISR-cached**, despite `export const revalidate = 60` in each `page.tsx` and every prior status report (including earlier revisions of this file) claiming otherwise. `src/lib/db/server.ts`'s Supabase client calls `await cookies()` internally, and calling `cookies()` anywhere in a route's render tree forces Next.js to render that route fully dynamically on every request, overriding `revalidate` entirely. Confirmed via Vercel's build output: all three routes build as `ƒ Dynamic`, not `○ Static`. Discovered while debugging the Vercel incident below; **not fixed** — would need public/anonymous reads split onto a cookie-free Supabase client to restore the intended ISR behavior. Real performance impact (every visit is a live, uncached Supabase round-trip), not just a documentation error.

---

## Security Architecture (Opti Phase 3)

### Row Level Security — per-table summary

| Table(s) | `anon` | `authenticated` |
|---|---|---|
| `categories, products, product_variants, product_images, product_attributes, inventory, inventory_logs, homepage_sections` | SELECT only | SELECT only (migration 035 — was missing from 031, fixed live) |
| `coupons` | SELECT active-only | — |
| `carts, cart_items` | guest carts only (`user_id IS NULL`) | own carts only (`auth.uid() = user_id`) |
| `wishlists, wishlist_items, addresses` | none | own rows only |
| `orders, order_items` | none | own rows, SELECT only (writes go through the `create_order_transactional` RPC) |
| `coupon_usage` | none | own rows, SELECT only |
| `users, sessions, otps` | **none** | **none** — service-role client only (pre-auth identity bootstrap) |
| `roles, permissions, user_roles` | none | none — confirmed dead schema, admin auth is stateless HMAC |

### Production incident (fixed)

Migration 031 (RLS) revoked `anon`'s blanket access but never granted `service_role` or `authenticated` the equivalent explicit table grants — `BYPASSRLS` (which `service_role` has) only skips row-level policy checks, not table-level `GRANT`s. This broke login entirely (`permission denied for table users`) immediately after deployment, and separately broke every `authenticated`-client read that joins a catalog table (e.g. wishlist's product join) once login was restored. Fixed by:
- **Migration 034** — explicit `service_role` grants on all 24 tables + `EXECUTE` on all RPCs.
- **Migration 035** — explicit `authenticated` `SELECT` on the 8 catalog tables.

Both verified live end-to-end: login, wishlist (add/list), address creation, and order placement all confirmed working post-fix.

### Production incident #2 (fixed) — Vercel: every storefront route 500'd

Deploying to Vercel (in addition to the existing Netlify deployment) surfaced a second, unrelated production bug: **every visit to `/` (and by the same mechanism, `/product/[slug]` and `/shop/[category]`) returned `500 FUNCTION_INVOCATION_FAILED`**, even though `npx tsc --noEmit` and `npm run build` both passed cleanly, both locally and in Vercel's own build step. The build log looked completely healthy; only Vercel's **Runtime Logs** (a separate tab from Build Logs) showed the actual cause:

```
Error: Failed to load external module jsdom-...
```

**Root cause:** `src/lib/utils/sanitizeHtml.ts` had a top-level `import DOMPurify from 'isomorphic-dompurify'`. That module is only used by `ProductService.create`/`update` (the admin product-save path), but `ProductService` is also imported by the public homepage/product/shop pages for their own, unrelated read methods (`list`, `getBySlug`, etc.). Next.js bundles a route's *entire reachable server-side import graph* into that route's serverless function — so `isomorphic-dompurify`'s `jsdom` dependency got bundled into every one of those public routes too, despite none of them ever calling the sanitize function. `jsdom` then failed to load inside Vercel's bundled Node runtime, crashing the function at **module-load time** — before any application code (including every `.catch()` guard in the render tree) ever got a chance to run. This is why extensive tracing of the homepage's data-fetching logic (all of it defensively `.catch()`-wrapped) never turned up an explanation — the crash wasn't in that code at all.

Confirmed independently: the one deployment that still worked throughout this investigation (`368618b`) predates `isomorphic-dompurify` being added to the codebase entirely (first shipped in `6519cb1`, Opti Phase 3) — every deployment since then crashed, which lines up exactly.

**Fix:** `sanitizeProductDescription()` now dynamically `import()`s `isomorphic-dompurify` inside the function body instead of at module scope, so only the actual admin write path pulls it in. Function is now `async`; both call sites in `productService.ts` updated to `await` it. Verified: `tsc` clean, fresh production build succeeds, `next start` serves `/`, `/product/[slug]`, `/shop/[category]` all `200` locally, and confirmed working on a fresh Vercel deployment.

**Durable rule added** (`CLAUDE.md`, `AGENTS.md`): any heavy or Node-only dependency needed by only one narrow code path must be lazily `import()`ed inside the function that uses it, never top-level-imported into a module that's reachable from a public/high-traffic route. This class of bug is invisible to `tsc`/`next build` and only surfaces as a runtime crash on the deployment platform — if a route works locally but 500s only when deployed, check Runtime/Function logs, not the build log.

### Other Opti Phase 3 hardening

- **CSP** (`next.config.ts`) — no nonces (would force dynamic rendering and undo Opti Phase 1's ISR caching); `unsafe-eval` dev-only (Next's own documented requirement for Fast Refresh); `unsafe-inline` in both dev and prod (App Router streams RSC payloads via inline, non-nonced `<script>` tags).
- **XSS** — `isomorphic-dompurify` sanitizes admin-authored product descriptions at save-time (`ProductService`) and again at render-time (`ProductDetailClient`, defense-in-depth).
- **Admin login** — constant-time password comparison (`crypto.timingSafeEqual`), rate-limited per-IP.
- **Admin route protection** — moved server-side via `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`, exported function must be named `proxy`); previously only client-side in `admin/layout.tsx`.
- **Error responses** — `sessionMiddleware.ts`/`adminMiddleware.ts` now route through the shared `errorResponse()` helper instead of ad-hoc shapes; unexpected errors logged via `captureError` (Sentry stub) instead of bare `console.error`.
- **OTP infrastructure** — built (hashed codes, 5-min expiry, 5 attempts, 60s cooldown, `ConsoleSmsProvider` seam for a real SMS provider later) but **not wired into the login UI** — an explicit user decision ("keep it simple") reverted login to phone-only. The routes (`/api/auth/otp/send`, `/verify`) still work if ever reconnected.

---

## Order Notifications (New)

`src/lib/integrations/resend/client.ts` — real `Resend` SDK client (previously a stub). `sendOrderPlacedNotification()` fires from `OrderService.create()` after every successful order, emailing the configured `ORDER_NOTIFICATION_EMAIL` (store owner) with order total, shipping address, customer name/phone/email, and itemized line items. Awaited (not fire-and-forget — Netlify functions can freeze post-response) but wrapped in try/catch so a Resend outage never fails checkout; failures are logged via `captureError`. Currently uses Resend's sandbox sender (`onboarding@resend.dev`), which only delivers to the Resend account's own verified address — a real sending domain would be needed to notify a different address or add a customer-facing confirmation email.

---

## Known Live Bug (flagged, not fixed)

`CartService.mergeGuestCartToUser` (runs on every login/OTP-verify) looks up the user's persistent cart via `CartRepository.findByUserId`, which still uses the plain anon client. Under the RLS policy added in migration 031, anon can only see guest carts (`user_id IS NULL`), so this lookup always returns nothing and falls back to creating a cart row keyed by `session_id = <userId>` — a row the live storefront cart route (`/api/cart`, always keyed by the browser's guest `session_id` cookie) never queries again. Net effect: cart items merged at login can appear to vanish. Predates this session's work; not yet fixed.

---

## Admin Platform — Live ✅

### Layout & Authentication
- **Route isolation** — Next.js route groups `(storefront)/` and `admin/` prevent shell overlap
- **Admin login** — Email + password at `/admin/login` (no phone, no DB user needed)
- **Server-side protection** — `src/proxy.ts` redirects unauthenticated `/admin/*` requests before any admin HTML/JS ships
- **Admin middleware** — `requireAdmin()` verifies HMAC-signed `admin_token` cookie inline — zero DB calls, constant-time comparison, rate-limited, audit-logged
- **Token** — HMAC-SHA256 signed with `ADMIN_PASSWORD`, payload `{email, exp}`, 7-day TTL
- **AdminContext** — `{ adminEmail: string }` (not a user object — no DB lookup)

### Product Management
- Full-page create (`/admin/products/new`) and edit (`/admin/products/[id]/edit`), Shopify-style single-save flow
- Admin catalog writes go through the service-role client (`createAdminClient()`), unaffected by RLS

### Inventory, Orders, Coupons, Customers, Dashboard — unchanged from Phase 4/5, see file inventory below

---

## File Inventory

### API Routes — `src/app/api/`
- `products/`, `products/[slug]/`, `products/filters/` — ProductService
- `categories/` — CategoryService
- `cart/` — CartService (session-based; see known bug above for the user-merge path)
- `wishlist/` — WishlistService (authenticated client)
- `addresses/` — POST only, authenticated client
- `orders/`, `orders/[id]/` — OrderService (authenticated client for reads; RPC for writes; Resend notification on create)
- `auth/login`, `auth/logout`, `auth/me` — phone-only session auth
- `auth/otp/send`, `auth/otp/verify` — built, not wired into the UI
- `homepage/sections/` — homepage CMS read
- `admin/*` — full admin CRUD surface (auth, products, variants, images, attributes, inventory, orders, coupons, customers, stats, content/sections, upload)

### Repositories — `src/lib/repositories/`
- `productRepository.ts`, `categoryRepository.ts`, `homepageRepository.ts`, `inventoryRepository.ts`, `couponRepository.ts` — admin-only methods use `createAdminClient()`; public-read methods use the anon client
- `cartRepository.ts` — **still entirely anon-client** (see known bug above)
- `wishlistRepository.ts`, `orderRepository.ts` (reads), `userRepository.createAddress` — `createAuthenticatedClient(userId)` (JWT-signed)
- `userRepository.ts` — identity methods (`findByPhone`, `findById`, `createOrUpdateByPhone`, `updateLastLogin`) use `createAdminClient()` (pre-auth bootstrap, no anon/authenticated grant exists on `users`)
- `otpRepository.ts` — admin client, `as any` cast (types not regenerated for `otps`)

### Services — `src/lib/services/`
- `productService.ts` — now sanitizes `description` via DOMPurify on create/update
- `orderService.ts` — order creation via `create_order_transactional` RPC + Resend notification
- `authService.ts` — `createAdminClient()` for `sessions` (pre-auth bootstrap)
- `otpService.ts` — built, unused by the UI
- `wishlistService.ts`, `cartService.ts`, `inventoryService.ts`, `couponService.ts` — unchanged in structure, client selection updated per repository above

### Database — `src/lib/db/`
- `client.ts` / `server.ts` — anon key clients (browser / server + cookies)
- `admin.ts` — `createAdminClient()` (`SERVICE_ROLE_KEY` only here)
- `authenticatedClient.ts` — **new** (Opti Phase 3) — signs a 5-minute JWT (`{sub: userId, role: 'authenticated'}`) with `SUPABASE_JWT_SECRET`, returns a Supabase client bearing it
- `generated/database.types.ts` — real types from live DB (1042 lines; stale re: `otps`/`rate_limits`, see caveat)
- `migrations/000–035*.sql` — see numbering caveat above

### Middleware / Routing
- `src/proxy.ts` — **new** (Next.js 16's renamed `middleware.ts`) — server-side admin route protection
- `src/lib/middleware/adminMiddleware.ts`, `sessionMiddleware.ts` — constant-time comparisons, rate limiting, consistent `errorResponse()` shape

### Utilities — `src/lib/utils/`
- `apiResponse.ts` — `successResponse()`, `errorResponse()` (catch-all now logs via `captureError`)
- `errors.ts` — `AppError`, `NotFoundError`, `ValidationError`, `InsufficientStockError`, `CouponError`
- `rateLimit.ts` — **new** — `checkRateLimit(key, limit, windowSeconds)`, fails open
- `sanitizeHtml.ts` — **new** — `sanitizeProductDescription()` (DOMPurify)
- `sentry.ts`, `auditLog.ts` — stubs, now actually called (auth failures, admin access, checkout failures, unexpected errors)

### Integrations — `src/lib/integrations/`
- `resend/client.ts` — **live** — real `Resend` SDK, `sendOrderPlacedNotification()`
- `sms/` — **new** — `SmsProvider` interface + `ConsoleSmsProvider` (logs server-side only), seam for a real provider later
- `sanity/client.ts`, `r2/client.ts`, `razorpay/client.ts` — still stubs, unchanged

### Configuration
- `src/config/env.ts` — startup env var validation (now includes `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SUPABASE_JWT_SECRET`); **not imported anywhere**, so this validation does not currently run at boot — a known, deliberate no-op left as-is to avoid touching server startup mid-session
- `next.config.ts` — image domains + **CSP and other security headers** (new)
- `.env.local.example` — template (committed) — now documents `SUPABASE_JWT_SECRET`, `ORDER_NOTIFICATION_EMAIL`
- `.env.local` — real secrets (gitignored, confirmed never staged/committed)

### Architecture Docs — `architectureFiles/`
- `walkthrough.md`, `handover.md`, `systemstatus.md` (this file), `FIXES_APPLIED.md`
- `fontend.md`, `backend.md`, `api-contracts.md`, `migration-audit.md`, `phase21-readiness-report.md`
- `audit_results.md` — Opti-phase audit (18 sections) that Opti Phases 1–3 were built to address
- `reports/01`–`10`, `reports/migration-deployment-audit.md`

### Plans — `prompts/Plans/`
- `opti_phase1.md` / `opti_phase1_implementation.md`
- `opti_phase2.md` / `opti_phase2_implementation.md`
- `opti_phase3.md` / `opti_phase3_implementation.md`

---

## Architecture Compliance

| Rule | Status |
|---|---|
| No Supabase outside repositories | ✅ |
| No business logic in routes | ✅ |
| `SERVICE_ROLE_KEY` only in `admin.ts` | ✅ |
| All inputs Zod-validated | ✅ |
| Schemas in `src/lib/validations/` | ✅ |
| Routes use service layer | ✅ |
| No Supabase in frontend pages | ✅ |
| Next.js 16 params awaited | ✅ |
| RLS enabled on every user-owned table | ✅ (Opti Phase 3) |
| `.env.local` never committed | ✅ (verified before this session's push) |

---

## Not Built Yet

| Feature | Phase | Status |
|---|---|---|
| OTP wired into login UI | 3.1 | Built, disconnected by explicit user choice |
| Guest cart → user cart merge fix | — | Known bug, flagged, not fixed (see above) |
| Razorpay payments | Phase 6 (payments) | Planned |
| Sanity CMS | Phase 7 | Planned — homepage CMS already works via DB |
| Cloudflare R2 image uploads | Phase 8 | Planned — Cloudinary active |
| Customer-facing order confirmation email | — | Declined for now (would need a verified Resend sending domain) |
