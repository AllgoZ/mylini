@AGENTS.md

# MYLINI v2 — AI Assistant Instructions

## Rules

- ALWAYS CREATE IMPLEMENTATION PLAN when I say "create plan", and SAVE THE FILE IN `prompts\Plans`
- NEVER put `SUPABASE_SERVICE_ROLE_KEY` anywhere except `src/lib/db/admin.ts`
- NEVER commit `.env.local` or any file containing secrets
- NEVER add code, features, or abstractions not explicitly requested
- NEVER call Supabase directly from services or API routes — repositories only
- NEVER add a top-level `import` of a heavy/Node-only package (jsdom-backed sanitizers, PDF/image libs, etc.) to a module that's reachable from a public storefront route unless every route that imports it actually needs it — `await import(...)` it lazily inside the function that uses it instead. This crashed every storefront page in production once already (see `architectureFiles/FIXES_APPLIED.md`, 2026-07-17, and `AGENTS.md`'s "Server-Side Import Chains" section) — `tsc`/`next build` both pass either way, it only fails at runtime on the deployment platform.

---

## Project

MYLINI v2 is a premium Indian children's ethnic wear e-commerce platform.

**Tech stack:** Next.js 16 (App Router) · TypeScript · Supabase (PostgreSQL) · Zod v4 · Zustand · Tailwind CSS · shadcn/ui

**Supabase project:** `jxazdoawlghbfzdmwwmu.supabase.co` (LIVE)

---

## Current Phase

| Phase | Status |
|---|---|
| Phase 1 — Frontend UI | ✅ Done |
| Phase 2 — Backend Foundation | ✅ Done |
| Phase 2.1 — DB Deployment & Verification | ✅ Done |
| Phase 2.2 — Audit & Hardening | ✅ Done |
| Phase 3A — Phone-identity Auth (MVP) | ✅ Done |
| Phase 4 — Professional Admin Platform | ✅ Done |
| Phase 5 — Performance Optimization | ✅ Done |
| Phase 5.1 — Admin Auth Hardening | ✅ Done |
| Phase 6 — UX & Mobile Improvements | ✅ Done |
| Opti Phase 1 — Backend Performance | ✅ Done |
| Opti Phase 2 — Perceived UX | ✅ Done |
| Opti Phase 3 — Security & Reliability (RLS, JWT auth, rate limiting, CSP, XSS sanitization, `proxy.ts`) | ✅ Done |
| Phase 3B — Wishlist Enhancements | ✅ Done — superseded by Opti Phase 3's real per-user RLS |
| Email — Resend order-placed notification | ✅ Done — store-owner notification only, sandbox sender |
| Phase 3.1 — OTP Verification | 🟡 Built, not wired — infra complete (migrations 032/033), login UI is still phone-only by explicit choice |
| Phase 6 — Payments (Razorpay) | 🔲 Planned — checkout UI already says "COD only, UPI/Card coming soon" |
| Phase 7 — Sanity CMS | 🔲 Planned — homepage CMS already works via DB-backed `homepage_sections` |
| Phase 8 — Image Storage (R2) | 🔲 Planned — Cloudinary is the active provider |

---

## Architecture — Read Before Touching Code

```
API Route → Zod validation → Service → Repository → Supabase
```

- **Repositories** (`src/lib/repositories/`) — ONLY place that calls Supabase
- **Services** (`src/lib/services/`) — business logic, calls repositories
- **API Routes** (`src/app/api/`) — validate input, call services, return `ApiResponse<T>`
- **Validations** (`src/lib/validations/`) — Zod schemas per domain (one file per domain)

---

## Supabase Client Architecture

| File | Client Type | Key Used | Use When |
|---|---|---|---|
| `src/lib/db/client.ts` | Browser | NEXT_PUBLIC_SUPABASE_ANON_KEY | Frontend React components |
| `src/lib/db/server.ts` | Server | NEXT_PUBLIC_SUPABASE_ANON_KEY | API routes, server components |
| `src/lib/db/admin.ts` | Admin | SUPABASE_SERVICE_ROLE_KEY | Admin-only operations |

---

## TypeScript / Zod Notes

- **Zod v4** — use `.issues` (not `.errors`, which was removed in v4)
- **database.types.ts** — REAL generated types (1042 lines from live DB). Regenerate with:
  `npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts`
- **Next.js 16 dynamic params** — `params` is a `Promise`; must `await params` before using

---

## Database Status

- **35 migration files deployed** (000–035) to live Supabase project ✅ — **note:** two files both named `031` (`031_order_tracking.sql` and `031_rls_and_permissions.sql`), both deployed correctly but the numeric prefix isn't a reliable ordering key past 030; see `architectureFiles/systemstatus.md` for the full caveat
  - Migration 025: Catalog write permissions (INSERT/UPDATE/DELETE on products, variants, images, inventory)
  - Migration 026–028: Product schema extensions (dimensions, barcode, product_type, tags, tax, compare_at_price)
  - Migration 029: Homepage CMS (banner, promo_blocks, featured_categories)
  - Migration 030: `create_order_transactional` RPC — atomic order creation
  - Migration 031 (`_rls_and_permissions`): **Real Row Level Security** on every user-owned table, replacing migration 022's blanket anon access
  - Migration 032/033: Rate limiting (`rate_limits` table + RPC) and OTP infrastructure (built, not wired into login UI)
  - Migration 034/035: `service_role`/`authenticated` explicit grants — required in addition to RLS policies (see below)
- **Types generated** from live schema — `src/lib/db/generated/database.types.ts` ✅ (stale re: `otps`/`rate_limits`, added after generation — `otpRepository.ts` casts the client to `any` as a documented workaround)
- **Seed data inserted** — 4 products, 8 variants, inventory, 4 images ✅
- **RLS is enabled and enforced** on every user-owned/transactional table (migration 031) — catalog tables are `anon`+`authenticated` SELECT-only; carts split guest(anon)/owner(authenticated); wishlists/addresses/orders/coupon_usage are `authenticated`-owner-only via a self-signed JWT (`src/lib/db/authenticatedClient.ts`, since this app has no Supabase Auth session); `users`/`sessions`/`otps` have **no** anon/authenticated grant at all, service-role client only
- **⚠️ `BYPASSRLS` (which `service_role` has) does NOT imply table-level access** — it only skips row-level policy checks. Every table `service_role` touches still needs an explicit `GRANT`. Forgetting this broke production login once already (migration 031 shipped without it; fixed by migration 034). Same for `authenticated` needing its own explicit `GRANT` separate from `anon`'s (fixed by migration 035, after wishlist's product join broke post-034). **When writing a new RLS migration, always pair new policies with the explicit `GRANT`s every role that will query under them actually needs — don't assume BYPASSRLS or an existing `anon` grant covers it.**
- **Admin auth** — stateless HMAC token, no DB user required (Phase 5.1)
- Migration source: `src/lib/db/migrations/`
- CLI-formatted copies: `supabase/migrations/` (has gaps — 026–029 and 031_order_tracking have no timestamped copy)
- **No automatic migration runner** — every migration here is written by the assistant and deployed manually by the user via the Supabase SQL Editor. Always confirm which migrations are actually live before assuming a schema change took effect.

---

## What Currently Works

### Storefront
✅ `npm run dev` — dev server starts  
✅ `npm run build` — 0 TypeScript errors  
✅ `GET /api/products` — returns real Supabase data (active status only)  
✅ `GET /api/categories` — category tree with nesting  
✅ `POST /api/auth/login` — phone-based user creation + session  
✅ `POST /api/auth/logout` — session revocation  
✅ `GET /api/auth/me` — session validation  
✅ `GET/POST /api/wishlist` — real per-user wishlist, RLS-enforced via a self-signed JWT (`authenticatedClient.ts`)  
✅ `POST /api/addresses` — RLS-enforced, same JWT-authenticated client  
✅ `GET/POST/PATCH/DELETE /api/cart` — full cart CRUD (session-based; see cart-merge-on-login known bug below)  
✅ `POST /api/orders` — complete order creation via the atomic `create_order_transactional` RPC, snapshots, **triggers a Resend order-notification email to the store owner**  
✅ Frontend UI renders with Navbar, Footer, ProductGrid, ProductDetail
✅ Home page displays **Featured Collection** section showing all active products by default
⚠️ **Known bug, not fixed**: `CartService.mergeGuestCartToUser` (runs on every login) still uses the anon client to look up a user's cart, which RLS now scopes to guest carts only — the merge silently writes to an orphaned cart row the storefront never reads back. See `architectureFiles/FIXES_APPLIED.md`.

### Admin Platform (Phase 4 + 5.1) ✅
✅ `POST /api/admin/auth/login` — email + password → HMAC-signed `admin_token` cookie (stateless, no DB)
✅ `GET /api/admin/stats` — dashboard metrics via SQL aggregates (no full-table scan)
✅ `GET /api/admin/products` — product list with search/filter (limit 30)
✅ `POST /api/admin/products` — create product with variants + images (defaults to `status='active'`)
✅ `PATCH /api/admin/products/[id]` — update product details + status
✅ `DELETE /api/admin/products/[id]` — delete product
✅ `GET /api/admin/inventory` — inventory list
✅ `PATCH /api/admin/inventory/[variantId]` — adjust stock with audit logging
✅ `/admin/login` page — email + password form (no phone, no DB user needed)
✅ `/admin` dashboard — 5 metrics + recent orders
✅ `/admin/products/new` — full-page create with pre-save variants/images
✅ `/admin/products/[id]/edit` — full-page edit with live variant/image management
✅ `/admin/inventory`, `/admin/orders`, `/admin/coupons`, `/admin/customers` — all working

### Admin Auth — CRITICAL (Phase 5.1)
**Admin login is fully stateless — no database user or role lookup required.**
- Login verifies `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars
- Issues HMAC-SHA256 signed `admin_token` cookie (signed with `ADMIN_PASSWORD`, 7-day TTL)
- `requireAdmin()` middleware verifies token signature + expiry inline — zero DB calls
- `AdminContext` exposes `{ adminEmail: string }` (not `user`)
- Audit fields use `ctx.adminEmail` (not `ctx.user.id`)
- **NEVER revert to user_roles/sessions table lookup for admin**

### Architecture
✅ All 20+ API routes structured, validated, connected to DB
✅ 8 repositories query live database (no direct Supabase elsewhere)
✅ 8 services contain business logic
✅ Zod schemas in dedicated `src/lib/validations/` folder
✅ Admin auth stateless — HMAC token, no DB user required
✅ Netlify configured — `netlify.toml` with secrets scan exclusions
✅ Frontend pages wired to real API (removed mock-only dependency)
✅ RLS policies — real per-user policies live (migration 031, replacing migration 022's blanket anon access)
✅ Security headers + production CSP (`next.config.ts`) — no nonces, ISR-compatible, dev-only `unsafe-eval`
✅ Admin route protection — server-side via `src/proxy.ts` (Next.js 16's renamed middleware), not just client-side
❌ OTP verification — infra built (migrations 032/033, `otpService.ts`, `/api/auth/otp/*`), not wired into login UI by explicit choice ("keep it simple")

---

## Key Reference Files

| Need | File |
|---|---|
| Full project overview | `architectureFiles/walkthrough.md` |
| Last session summary | `architectureFiles/handover.md` |
| Detailed file inventory | `architectureFiles/systemstatus.md` |
| API endpoint contracts | `architectureFiles/api-contracts.md` |
| Migration schema audit | `architectureFiles/migration-audit.md` |
| Phase 2.2 audit reports | `architectureFiles/reports/01` through `10` |
| Phase 4 plan (completed) | `prompts/Plans/phase4_product_form_fixes.md` |

---

## How to Add a Feature

1. Add Zod schema in `src/lib/validations/`
2. Add repository method in `src/lib/repositories/` (only Supabase calls here)
3. Add service method in `src/lib/services/` (business logic, no Supabase)
4. Add API route in `src/app/api/`
5. Run `npx tsc --noEmit` — must stay at 0 errors

---

## Known Technical Debt

### Opti Phases 1–3 + Production Incidents ✅ (Fixed 2026-07-17)
- **Opti Phase 1** — atomic `create_order_transactional` RPC (replaced multi-step order creation), optimistic cart UI, trimmed queries, AVIF images
- **Opti Phase 2** — blur/fade image loading (`FadeImage`), route-level `loading.tsx` skeletons, code-split size chart, preload/prefetch tuning
- **Opti Phase 3** — real RLS + JWT-signed authenticated client, rate limiting, CSP, DOMPurify XSS sanitization, `proxy.ts` admin protection, OTP infra (built, unwired)
- **Production incident #1** — migration 031 (RLS) shipped without explicit `service_role`/`authenticated` grants (BYPASSRLS ≠ table grants); broke login and every authenticated read; fixed by migrations 034/035
- **Production incident #2 (Vercel)** — `sanitizeHtml.ts`'s top-level `isomorphic-dompurify` import got bundled into every public route via `ProductService`, and `jsdom` failed to load in Vercel's runtime, 500-ing every storefront page; fixed by lazy-`import()`ing it inside the function instead. See the new Rules bullet above and `AGENTS.md` — this class of bug is easy to reintroduce.
- **Not yet fixed**: guest-cart-merge-on-login bug (see "What Currently Works" above); `/`, `/product/[slug]`, `/shop/[category]` are fully dynamic rather than actually ISR-cached because `src/lib/db/server.ts` calls `cookies()` internally, defeating `revalidate = 60`
- Full detail on all of the above: `architectureFiles/FIXES_APPLIED.md`, `architectureFiles/systemstatus.md`, `architectureFiles/handover.md`

### Phase 5.1 Admin Auth ✅ (Fixed 2026-07-08)
- Removed phone-based user lookup; admin is now fully stateless
- `requireAdmin()` uses HMAC-signed cookie — no sessions table, no user_roles table
- `AdminContext.adminEmail` replaces `AdminContext.user.id`

### Phase 5 Performance ✅ (Fixed)
- ISR caching on shop/product pages (revalidate=60)
- SQL aggregates in admin stats — no full-table scan
- Explicit column selects — no wildcard `select('*')`
- Cart nested query — single round-trip instead of two
- Admin products limit 30 (was 100)

### Phase 4 Complete ✅
- Admin layout isolation via route groups
- Full-page product create/edit (Shopify-style)
- Migration 025 for catalog write permissions

### Phase 3B — Resolved by Opti Phase 1/3 ✅
- ~~`orderService.ts` — no PostgreSQL transaction wrapping multi-step order creation~~ → fixed by the `create_order_transactional` RPC (migration 030, Opti Phase 1)
- ~~`src/lib/db/migrations/022` — RLS disabled~~ → replaced by migration 031's real per-user policies (Opti Phase 3)
- ~~Frontend pages — still using mock data~~ → `src/data/mockProducts.ts` still exists on disk but nothing imports it; every page is wired to the real API. Safe to delete, not yet cleaned up (cosmetic, out of scope).

---

## Environment Variables

**IMPORTANT:** Set ALL these variables in your deployment platform's dashboard (Netlify: Site Settings → Build & deploy → Environment; Vercel: Project Settings → Environment Variables) for the demo to work. `.env.local` never leaves your machine — it's gitignored and was never part of either platform's setup automatically.

```env
# Admin Credentials (server-side only, never exposed to browser)
ADMIN_EMAIL=admin@mylini.com
ADMIN_PASSWORD=[SET_IN_PLATFORM_DASHBOARD]

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
# Dashboard -> Settings -> API -> JWT Settings -> "JWT Secret" (legacy HS256 secret, not
# the anon/service keys). Signs short-lived JWTs for authenticated-role RLS requests
# (src/lib/db/authenticatedClient.ts) — required for wishlist/addresses/order-read routes.
SUPABASE_JWT_SECRET=[YOUR_SUPABASE_JWT_SECRET]

# Image Storage — active provider: "cloudinary" | "cloudflare"
STORAGE_PROVIDER=cloudinary

# Cloudinary (Phase 5+ — active)
CLOUDINARY_CLOUD_NAME=[YOUR_CLOUDINARY_NAME]
CLOUDINARY_API_KEY=[YOUR_API_KEY]
CLOUDINARY_API_SECRET=[YOUR_API_SECRET]

# Cloudflare R2 (future migration path)
CLOUDFLARE_R2_ENDPOINT=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=

# Sanity CMS (Phase 7+)
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_TOKEN=

# Resend Email — active. Sends an order-notification email to ORDER_NOTIFICATION_EMAIL
# whenever OrderService.create() succeeds. Currently uses Resend's sandbox sender
# (onboarding@resend.dev), which only delivers to the Resend account's own verified
# address — a verified sending domain is needed to notify any other address.
RESEND_API_KEY=[YOUR_RESEND_API_KEY]
ORDER_NOTIFICATION_EMAIL=[STORE_OWNER_EMAIL]

# Razorpay Payments (Phase 6+)
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

**Demo Deployment on Netlify:**
1. Go to Site Settings → Build & deploy → Environment
2. Add all variables above (set actual values from `.env.local`)
3. Trigger redeploy: Deployments → Trigger deploy → Deploy site
4. Login with your admin email and password

**Demo Deployment on Vercel:**
1. Project Settings → Environment Variables → add all variables above. Vercel's UI accepts a bulk paste of `KEY=VALUE` lines — faster and less error-prone than typing each one (the JWT secret especially: it contains `/`, `+`, and a trailing `==`, easy to mis-type by hand).
2. **Check the environment scope on each variable** (Production / Preview / Development checkboxes) — a variable saved under one scope is invisible to a deployment in another. If you're testing a Preview URL, make sure Preview is checked too.
3. **Adding/editing env vars does NOT retroactively apply to an already-built deployment.** You must trigger a new one — push a new commit, or use the "Redeploy" button on a specific deployment in the dashboard.
4. `NEXT_PUBLIC_*` vars are inlined into the client bundle at build time — same rule, a fresh build is required after adding/changing one.

**Note:** Never commit secrets to git. For production, use a secure secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.).

---

## Supabase CLI

Project is linked. To re-deploy or push new migrations:

```bash
SUPABASE_ACCESS_TOKEN="sbp_..." npx supabase db push --linked
```
