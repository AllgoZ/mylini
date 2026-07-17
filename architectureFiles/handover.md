# Handover — MYLINI v2
**Last Updated:** 2026-07-17 (later same day — Vercel deployment incident + fix)
**Phase Completed:** Opti Phase 1–3 (Performance, Perceived UX, Security & Reliability) + two production incident fixes + Resend order notifications
**Database:** LIVE ✅ — Supabase `jxazdoawlghbfzdmwwmu.supabase.co` (35 migration files deployed, RLS enabled on every user-owned table)
**Admin Platform:** WORKING ✅ — Stateless HMAC token auth, no DB user required, now also protected server-side via `proxy.ts`
**Storefront API:** WORKING ✅ — RLS-enforced, JWT-signed authenticated client for logged-in reads, rate limited — **not actually ISR-cached, see below**
**Email:** LIVE ✅ — Resend order-placed notification to the store owner
**Deployment:** Netlify ✅ (mylini-demo.netlify.app) — Vercel ✅ (mylini.vercel.app, confirmed working after the incident below). Both auto-deploy from `main`; pushed to `origin/main` at commit `16e9d92`.

---

## Phase Progress

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Done | Frontend UI — pages, components, Zustand stores |
| Phase 2 | ✅ Done | Backend foundation — DB schema, repos, services, API |
| Phase 2.1 | ✅ Done | DB deployment prep — scripts, env config, seed data |
| Phase 2.2 | ✅ Done | Audit & hardening — architecture violations fixed |
| Phase 2.3 | ✅ Done | Live API validation — all endpoints tested against live DB |
| Phase 3A | ✅ Done | Phone-identity auth — login/session/middleware |
| Phase 3+4 | ✅ Done | CMS + Admin platform — Homepage sections + full product management |
| Phase 5 | ✅ Done | Performance optimization — ISR, SQL aggregates, query optimization |
| Phase 5.1 | ✅ Done | Admin auth hardening — stateless HMAC token, Netlify deployment fixed |
| Phase 6 | ✅ Done | UX & mobile — order tracking, order detail, cart layout, related products |
| Opti Phase 1 | ✅ Done | Backend performance — atomic order RPC, optimistic cart, AVIF |
| Opti Phase 2 | ✅ Done | Perceived UX — blur/fade images, loading states, preload tuning |
| Opti Phase 3 | ✅ Done | Security — RLS, JWT auth, rate limiting, CSP, XSS sanitization, `proxy.ts` |
| Production incident #1 | ✅ Fixed | RLS grant gaps (migration 031) broke login + authenticated reads; fixed by 034/035 |
| Production incident #2 | ✅ Fixed | Vercel: `isomorphic-dompurify`/`jsdom` leaked into every public route's bundle via `ProductService`, 500'd every storefront page; fixed by lazy-loading it |
| Resend integration | ✅ Done | Order-placed email to store owner |

---

## What Was Done This Session

This session covered three planned optimization phases (each read from `prompts/Plans/opti_phaseN.md`, planned, then executed), a live production incident discovered immediately after, and one new integration requested mid-session.

### Opti Phase 1 — Backend Performance
- **`create_order_transactional`** (migration 030) — atomic, `SECURITY DEFINER` Postgres RPC replacing a multi-step, N+1-prone order-creation sequence (row-locks stock, validates, decrements, records coupon usage, all in one transaction with rollback on failure).
- Optimistic cart UI updates (`useCartStore`), trimmed product-detail query (`DETAIL_SELECT_INNER`), AVIF image format, homepage batched section fetch (`findByTypes`).

### Ad-hoc fix (between phases)
- Removed the mobile sticky "Add to Cart" bar on the product page per explicit request; kept the existing inline button + "Added to cart" confirmation.

### Opti Phase 2 — Perceived UX
- `FadeImage` (blur+fade wrapper over `next/image`), route-level `loading.tsx` for shop/product pages, `SizeChartModal` extracted for `next/dynamic`, adjacent-image preload on product pages, passive scroll listener on the navbar, Cloudinary preconnect.

### Opti Phase 3 — Security, Reliability & Production Readiness
The largest phase. Closed the most serious findings from `architectureFiles/audit_results.md`:
- **Real per-user RLS**, backed by a self-signed JWT (`src/lib/db/authenticatedClient.ts`) since this app has no Supabase Auth session — `auth.uid()` is populated from a JWT the app mints itself from an already-validated phone/session login.
- **Rate limiting** — Supabase-table-based (`rate_limits` + `check_rate_limit()` RPC, fixed window, fails open), applied to OTP, checkout, coupon validation, cart/wishlist mutation, admin login, admin API.
- **XSS defense** — `isomorphic-dompurify` sanitizes admin product descriptions at save-time and render-time.
- **Production CSP** — no nonces (would force dynamic rendering and undo Opti Phase 1's ISR win), dev-only `unsafe-eval`, `unsafe-inline` in both environments (RSC streaming requirement). Implemented per an explicit, detailed user directive after an incident (see below) — DOMPurify remains the primary XSS defense, CSP is defense-in-depth.
- **`src/proxy.ts`** — Next.js 16 renamed `middleware.ts` → `proxy.ts` (confirmed by reading `node_modules/next/dist/docs/` per `AGENTS.md`'s warning); moved admin route protection server-side.
- **Admin login hardening** — constant-time password comparison, rate limiting.
- **OTP infrastructure** — built in full (hashed codes, 5-min expiry, 5 attempts, 60s cooldown, pluggable `SmsProvider`) but **not wired into the login UI**. Mid-phase, the user reported the whole site had stopped loading and said "I don't need OTP verification right now, keep it simple" — see incident below.
- Consistent error-response shapes, logging wired into the existing Sentry/audit-log stubs.

### Site-down incident, mid-Opti-Phase-3
Two related incidents, both resolved within the same session:

1. **CSP broke the dev server entirely.** The first CSP draft (`script-src 'self'`, no `unsafe-eval`) blocked Next's dev-mode Fast Refresh/HMR — pages server-rendered but no client JS ever ran. Diagnosed via Next's own bundled CSP docs; fixed with dev-only `unsafe-eval` + `unsafe-inline` (required in prod too, for RSC streaming) after the user gave an explicit written directive authorizing exactly that tradeoff.
2. **Migration 031 (RLS) broke login and every authenticated-client read.** Root cause: 031 revoked `anon`'s blanket table access but never granted `service_role` or `authenticated` the equivalent explicit grants — `BYPASSRLS` (which `service_role` has) only skips row-level policy checks, not table-level `GRANT`s. Confirmed via Postgres's own error (`permission denied for table users`, later `permission denied for table products`). Fixed with two new migrations:
   - **Migration 034** — explicit `service_role` grants on all 24 tables + `EXECUTE` on all RPCs.
   - **Migration 035** — explicit `authenticated` `SELECT` on the 8 catalog tables (found while retesting wishlist post-034 — its product/image join still failed).
   Both deployed by the user via the SQL Editor; verified live end-to-end afterward: login, wishlist add/list, address creation, order placement all confirmed `200`/`201`.

Also reverted, per explicit user choice, from the in-progress OTP flow back to simple phone-only login (`loginSchema`, `/api/auth/login`, `PhoneModal.tsx`, `useAuthStore.login()`) — the OTP backend infrastructure was left in place, unused, rather than deleted, in case it's reconnected later.

### Resend order-notification integration (new, user-requested mid-session)
- `src/lib/integrations/resend/client.ts` — replaced the stub with a real `Resend` SDK client. `sendOrderPlacedNotification()` builds an HTML email (order total/subtotal/discount, shipping address, customer name/phone/email, itemized line items — all user-controlled fields HTML-escaped) and sends it to `ORDER_NOTIFICATION_EMAIL`.
- Wired into `OrderService.create()` — **awaited**, not fire-and-forget (Netlify functions can freeze immediately after the response is sent), wrapped in try/catch so a Resend outage never fails checkout.
- Verified live: sent a direct test email via the Resend API (confirmed key validity + sandbox deliverability to the configured address), then placed a real order end-to-end through the app and confirmed no error surfaced from the notification step.
- Uses Resend's sandbox sender (`onboarding@resend.dev`) — only delivers to the Resend account's own verified address. A verified sending domain would be needed to notify a different address or add a customer-facing confirmation email later.

### Discovered but not fixed — flagged for the next session
`CartService.mergeGuestCartToUser` (runs on every login) looks up the user's cart via `CartRepository.findByUserId`, which still uses the plain anon client — under migration 031's RLS, anon can only see guest carts, so this always returns nothing and falls back to creating an orphaned cart row the live storefront never queries again. Cart items merged at login can appear to vanish. Predates this session; not yet fixed.

### Production incident #3 (fixed) — Vercel deployment 500'd on every route
Later the same day, the user connected the repo to Vercel (in addition to the existing Netlify deployment) and every page returned `500`. This took several rounds to diagnose correctly — worth recording the wrong turns, not just the answer:

1. **First hypothesis (wrong): missing environment variables.** `.env.local` is gitignored and had never been added to Vercel's dashboard, so this was a reasonable first guess — and a real, separate problem that did need fixing (the user hadn't added the env vars yet at that point). Walked through adding all of them, plus the Vercel-specific gotchas: environment scope (Production/Preview/Development checkboxes) and that adding a var doesn't retroactively apply to an already-built deployment — a new one must be triggered.
2. **Second hypothesis (wrong, but productive): the homepage's own data-fetching.** Traced the entire `/` render tree — every fetch call (`ProductService`, `HomepageService`, `getCategories()`) is `.catch()`-guarded, so nothing there should crash even with bad env vars. Found one real, independent bug along the way: `CategoryCircles` (a Server Component) imported `getCategories()` from `src/lib/api/categories.ts`, which does `fetch('/api/categories')` with a **relative URL** — invalid in a Node/SSR context, works only in the browser. Fixed (commit `540b285`) by calling `CategoryService.getWithChildren()` directly instead, matching the pattern the rest of the homepage already used. Real bug, but turned out not to be the crash — it was already silently caught.
3. **User provided the actual Vercel Runtime Log** (not the Build Log, which looked completely clean and had been the only log available until this point) — it read `Error: Failed to load external module jsdom-...`. This was the real answer: `src/lib/utils/sanitizeHtml.ts` had a top-level `import DOMPurify from 'isomorphic-dompurify'`. That's only called by `ProductService.create`/`update` (admin-only), but `ProductService` is imported by the homepage/product/shop pages for unrelated read methods too — Next.js bundles a route's whole reachable server import graph into its function, so `jsdom` got dragged into every public route's bundle and failed to load on Vercel, crashing at **module-load time**, before any of the `.catch()`-guarded application code from hypothesis #2 ever ran. This is exactly why tracing the render tree found nothing — the bug wasn't in that code at all. Independently corroborated: the one deployment that still worked (`368618b`) predates `isomorphic-dompurify` being added to the codebase at all.
4. **Fix** (commit `16e9d92`): `sanitizeProductDescription()` now `await import('isomorphic-dompurify')`s lazily inside the function body instead of at module scope. Function is now `async`; both call sites in `productService.ts` updated. Verified via `tsc`, a fresh `next build`, and a local `next start` serving `/`, `/product/[slug]`, `/shop/[category]` as `200` — then confirmed working on a fresh Vercel deployment.

**New durable rule added to `CLAUDE.md` and `AGENTS.md`**: never top-level-import a heavy/Node-only dependency into a module reachable from a public route unless every route importing it actually needs it — lazy-`import()` it inside the function that uses it instead. This class of bug passes `tsc`/`next build` cleanly and only surfaces as a runtime crash on the deployment platform.

**Also discovered, not fixed**: `/`, `/product/[slug]`, `/shop/[category]` all build as `ƒ Dynamic` rather than `○ Static`, despite `revalidate = 60` — `src/lib/db/server.ts`'s Supabase client calls `cookies()` internally, which forces Next.js out of static rendering wherever it's used. The "ISR caching" claims in earlier revisions of this file and `systemstatus.md` were wrong; corrected in this update. Real performance impact, not just a docs error — every visit does a live Supabase round-trip. Not fixed this session.

### Committed and pushed
- `6519cb1` — the full Opti Phase 1–3 + incident #1 fix + Resend integration (65 files)
- `9e67478` — documentation refresh (systemstatus/handover/FIXES_APPLIED/fontend)
- `d664a8f` — empty commit, triggered a Vercel redeploy after env vars were added
- `540b285` — `CategoryCircles` relative-fetch fix
- `16e9d92` — the actual jsdom/isomorphic-dompurify lazy-load fix (incident #3)

`.env.local` confirmed never staged at any point (diff scanned for secret patterns before every commit).

---

## What Was Done Previous Sessions (Phase 5.1 and earlier)

<details>
<summary>Phase 5.1 — Admin Auth Hardening</summary>

**Problem:** Admin login returned "Internal server error" on Netlify — it looked up a user with the `admin` role in `user_roles`, but no such user existed.

**Fix:** Stateless HMAC token auth — zero database calls. Verify `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars, issue an HMAC-SHA256 signed `admin_token` cookie (signed with `ADMIN_PASSWORD`, 7-day TTL), `requireAdmin()` verifies signature + expiry inline.

**Key point:** `AdminContext` has `{ adminEmail: string }`, not a `user` field.
</details>

<details>
<summary>Phase 5 — Performance Optimization</summary>

21 performance issues identified and fixed: SQL aggregates in admin stats (was full-table scan), cart-fetch guard in Navbar, primary-image extraction pushed to DB, single nested cart query, ISR caching on shop/product pages (revalidate=60, biggest win), admin product list capped at 30, explicit column selects throughout. ~20-30% overall improvement.
</details>

<details>
<summary>Phase 4 — Admin Platform</summary>

Route-group layout isolation, email+password admin login, Shopify-style full-page product create/edit with pre-save variant/image buffering, migration 025 (catalog write permissions), full admin dashboard (products, inventory, orders, coupons, customers).
</details>

---

## Current System State

### Build
```
npx tsc --noEmit  →  0 errors ✅
npm run build     →  ✅ Passing
```

### Database (Live)
```
Project: jxazdoawlghbfzdmwwmu.supabase.co
Migration files: 35 (000–035; duplicate "031" numbering — see systemstatus.md caveat) ✅
Tables: 24 (added otps, rate_limits this session) ✅
RPC functions: 9 ✅
RLS: enabled on every user-owned/transactional table ✅
Permissions: anon narrowed to public reads + guest carts; authenticated scoped per-user; service_role explicit grants (migration 034) ✅
```

### Admin Platform (WORKING ✅)
```
Login:       POST /api/admin/auth/login → HMAC-signed admin_token cookie (no DB)
Protection:  src/proxy.ts redirects unauthenticated /admin/* server-side
Middleware:  requireAdmin() → verifyAdminToken() inline, constant-time, rate-limited
Context:     AdminContext = { adminEmail: string }
```

### Storefront API (Working, RLS-enforced; `/`, `/product/[slug]`, `/shop/[category]` render fully dynamically, not ISR-cached — see caveat above)
```
GET /api/products, /api/products/[slug], /api/categories     ✅ anon client, public reads
GET/POST/PATCH/DELETE /api/cart                               ✅ anon client, session-based (see cart-merge bug above)
GET/POST /api/wishlist                                        ✅ authenticated (JWT) client
POST /api/addresses                                            ✅ authenticated (JWT) client
POST /api/orders, GET /api/orders, /api/orders/[id]            ✅ RPC write + authenticated-client reads; Resend notification on create
POST /api/auth/login, /logout, GET /api/auth/me                ✅ phone-only, service-role client (pre-auth bootstrap)
POST /api/auth/otp/send, /verify                               🟡 built, not called by the UI
```

---

## Critical Architecture Rules

1. **Only repositories call Supabase** — services and routes must not call `.from()` directly
2. **`SUPABASE_SERVICE_ROLE_KEY` in `admin.ts` ONLY** — never import elsewhere
3. **`.env.local` never committed** — use `.env.local.example` as template (now includes `SUPABASE_JWT_SECRET`, `ORDER_NOTIFICATION_EMAIL`)
4. **Zod schemas in `src/lib/validations/`** — no inline schemas in route files
5. **RLS is real now** — `anon`/`authenticated` grants are least-privilege; any new authenticated-client query that joins a table needs to confirm that table actually grants `SELECT` to `authenticated` (migration 031 missed catalog tables — fixed in 035; check before assuming a grant exists)
6. **Migration files ≠ deployment state** — this project has no automatic migration runner; every migration is written here and run manually via the Supabase SQL Editor by the user. Always ask/confirm which migrations are actually live before assuming a schema change took effect.
7. **Never top-level-import a heavy/Node-only dependency into a module reachable from a public route** — `await import(...)` it lazily inside the function that actually uses it. Next.js bundles a route's whole reachable server import graph into that route's serverless function; a top-level import in a shared module ships to every route that imports that module, not just the one that calls it. This crashed every storefront page on Vercel once already (`isomorphic-dompurify`/`jsdom` via `ProductService` → `sanitizeHtml.ts`, see Production incident #3 above). Passes `tsc`/`next build` cleanly either way — only shows up as a runtime crash on the deployment platform.

---

## Files to Read First (New Chat)

1. `CLAUDE.md` — rules for this AI assistant
2. `architectureFiles/walkthrough.md` — full project overview
3. `architectureFiles/systemstatus.md` — complete current-state file inventory (companion to this file)
4. `architectureFiles/api-contracts.md` — endpoint documentation
5. `AGENTS.md` — Next.js 16 breaking-changes warning + admin-auth-is-stateless warning (both non-obvious and already bit this project once each)

---

## Known Deferred / Open Items

| Item | Priority | Notes |
|---|---|---|
| Guest cart → user cart merge bug | Should fix soon | `CartRepository.findByUserId` still anon-client; see "Discovered but not fixed" above |
| OTP wired into login UI | Deferred by choice | Infrastructure complete, just disconnected; user chose phone-only for simplicity |
| `database.types.ts` regeneration | Low urgency | Stale re: `otps`/`rate_limits`; one `as any` cast currently compensates |
| Razorpay integration | Planned | Payment flow ready, provider pending |
| Sanity CMS | Planned | Homepage CMS already works via DB |
| Resend customer confirmation email | Declined for now | Needs a verified sending domain (currently sandbox-only, one fixed recipient) |
| Cloudflare R2 images | Planned | Cloudinary active |
| Duplicate migration "031" numbering | Cosmetic | Both files deployed correctly; just don't trust the numeric prefix as an ordering key past 030 |
| `/`, `/product/[slug]`, `/shop/[category]` not actually ISR-cached | Should fix | `server.ts`'s `cookies()` call forces dynamic rendering despite `revalidate = 60`; real perf impact, discovered during the Vercel incident |

---

## Supabase Project

| Key | Value |
|---|---|
| Project URL | https://jxazdoawlghbfzdmwwmu.supabase.co |
| Project ID | `jxazdoawlghbfzdmwwmu` |
| Anon key | In `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (new-format `sb_publishable_...`) |
| Service role | In `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` (new-format `sb_secret_...`) — server-only |
| JWT secret | In `.env.local` as `SUPABASE_JWT_SECRET` — used to self-sign `authenticated`-role JWTs, see `authenticatedClient.ts` |

---

## File Locations

### Database & Migrations
| What | Where |
|---|---|
| All migration source files | `src/lib/db/migrations/000–035*.sql` |
| CLI-formatted migrations | `supabase/migrations/` (has gaps — see systemstatus.md) |
| Generated DB types | `src/lib/db/generated/database.types.ts` (stale, see caveat above) |

### API Routes
| What | Where |
|---|---|
| Storefront API | `src/app/api/` (products, categories, cart, wishlist, addresses, orders) |
| Auth API | `src/app/api/auth/` (login, logout, me, otp/send, otp/verify) |
| Admin API | `src/app/api/admin/` (auth, products, inventory, orders, coupons, customers, stats, content/sections, upload) |

### Security / Middleware
| What | Where |
|---|---|
| Admin route protection | `src/proxy.ts` |
| Admin/session middleware | `src/lib/middleware/adminMiddleware.ts`, `sessionMiddleware.ts` |
| JWT-signed authenticated client | `src/lib/db/authenticatedClient.ts` |
| Rate limiting | `src/lib/utils/rateLimit.ts` |
| XSS sanitization | `src/lib/utils/sanitizeHtml.ts` |

### Repositories & Services
| What | Where |
|---|---|
| Repositories | `src/lib/repositories/` (product, category, homepage, cart, wishlist, inventory, coupon, order, user, otp) |
| Services | `src/lib/services/` (same domain structure, + otpService) |
| Validations | `src/lib/validations/` (schemas for all domains) |
| Domain types | `src/types/` (product, cart, order, user, coupon) |

### Documentation
| What | Where |
|---|---|
| Full project overview | `architectureFiles/walkthrough.md` |
| System status & inventory | `architectureFiles/systemstatus.md` |
| API contracts | `architectureFiles/api-contracts.md` |
| Migration audit | `architectureFiles/migration-audit.md` |
| Opti-phase audit (source of Opti Phases 1–3) | `architectureFiles/audit_results.md` |
| Opti-phase plans | `prompts/Plans/opti_phase1.md`, `opti_phase2.md`, `opti_phase3.md` (+ `_implementation.md` copies) |
| Fix log | `architectureFiles/FIXES_APPLIED.md` |
