# MYLINI v2 — Project Walkthrough
**Last Updated:** 2026-08-01
**Branch:** `feature/storefront-ux-polish-and-coupons` — 15 commits ahead of `main`, not yet merged
**Phase Completed:** Everything through the checkout/order-details bug-fix bundle — see the Phase Map below for the full list

---

## What Is This Project?

MYLINI v2 is a **premium Indian children's ethnic wear e-commerce platform** built on:

- **Next.js 16** (App Router) — server-side rendering, API routes, `src/proxy.ts` (Next 16's renamed middleware)
- **Supabase** — PostgreSQL database, real Row Level Security, no Supabase Auth (identity is phone-based for customers, stateless HMAC for admin)
- **TypeScript** — fully typed, Zod v4 validation
- **Zustand** — client-side state (cart, wishlist, auth)
- **Tailwind CSS 4 + shadcn/ui** — UI components, `@theme`-based design tokens
- **Cloudinary** — active image storage provider (both product images and CMS images)
- **Resend** — transactional order-notification email (store owner only, sandbox sender)

This file is the fastest way to get oriented. For what actually changed most recently and why, read `handover.md`. For a detailed current-state file inventory, read `systemstatus.md`.

---

## Phase Map

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Done | Frontend UI |
| Phase 2 | ✅ Done | Backend Foundation — DB schema, repos, services, API |
| Phase 2.1–2.2 | ✅ Done | DB deployment, verification, architecture-violation audit |
| Phase 3A | ✅ Done | Phone-identity auth — login/session/middleware |
| Phase 3+4 | ✅ Done | Homepage CMS + full admin product management |
| Phase 5 | ✅ Done | Performance optimization — ISR caching, SQL aggregates |
| Phase 5.1 | ✅ Done | Admin auth hardening — stateless HMAC token |
| Phase 6 | ✅ Done | UX & mobile improvements — tracking, order detail, cart layout, related products |
| Opti Phase 1–3 | ✅ Done | Atomic order RPC, perceived-UX polish (blur-load images, skeletons), real RLS + JWT auth + rate limiting + CSP + XSS sanitization + `proxy.ts` |
| Storefront UX/mobile polish + coupons | ✅ Done | Login-gating, stock UX, address book, coupons at checkout, global type-scale |
| Admin Settings, Category management, Featured Category tagging | ✅ Done | Real Boys/Girls category tree, Featured Category CMS tiles, product-level tagging |
| Myntra-style homepage | ✅ Done | Banner carousel, mobile bottom nav, working search, Cloudinary CMS uploads |
| Responsive/Shopify-style banner editor, real contact details | ✅ Done | Mobile/desktop dual image upload, focal-point picker, live preview |
| About Us CMS | ✅ Done | Fully admin-editable About Us page (migration 039) |
| Banner overlay-clutter fix | ✅ Done | Image-only banners render clean, no empty badge/CTA |
| Checkout/order-details bug-fix bundle | ✅ Done | Real product images (incl. legacy-order fallback), order totals that include shipping/tax (migration 040), COD wording |
| Category live-data cleanup | ✅ Done | 8 stray rows soft-deleted; live table matches the documented Boys/Girls-only model |
| Phase 3.1 — OTP verification | 🟡 Built, not wired | Infra complete (migrations 032/033), login UI still phone-only by explicit choice |
| Tax-inclusive pricing policy | 🔲 Needs client clarification | Genuinely ambiguous feedback, not implemented |
| Estimated delivery time by pincode | 🔲 Needs a logic decision | New feature, no existing infra |
| Payments (Razorpay) | 🔲 Planned | Checkout is COD-only |
| Sanity CMS | 🔲 Planned | Homepage CMS already works via DB-backed `homepage_sections` |
| Cloudflare R2 image storage | 🔲 Planned | Cloudinary is the active provider |

---

## Project Directory Map

```
mylini-v2/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  ← Root layout (bare — fonts + Toaster only)
│   │   ├── globals.css                 ← Design tokens (@theme); site background is #fff3e6
│   │   ├── proxy.ts (src/proxy.ts)     ← Next.js 16's renamed middleware — admin route gate
│   │   │
│   │   ├── (storefront)/               ← Route group — customer-facing pages
│   │   │   ├── layout.tsx              ← Navbar, Footer, AuthProvider, PhoneModal,
│   │   │   │                             MobileBottomNav, maintenance-mode gate
│   │   │   ├── page.tsx                ← Home (ISR, revalidate=60, genuinely static)
│   │   │   ├── search/, about/, shop/[category]/, product/[slug]/, cart/, checkout/,
│   │   │   │   orders/, orders/[id]/, wishlist/, account/, collections/, about-us/, contact/
│   │   │
│   │   ├── admin/                      ← Route group — admin platform
│   │   │   ├── login/, settings/, categories/, about/, products/, inventory/, orders/,
│   │   │   │   coupons/, customers/, content/{banner,promo-blocks,featured-categories}/
│   │   │
│   │   └── api/                        ← ~44 route files — see systemstatus.md for the full list
│   │       ├── products/, categories/, cart/, wishlist/, orders/, addresses/, coupons/,
│   │       │   settings/, homepage/sections/, auth/{login,logout,me,otp}/
│   │       └── admin/                  ← auth/login, stats, products, categories, inventory,
│   │                                     orders, coupons, customers, settings, about,
│   │                                     content/sections, upload, upload/cms
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts               ← Browser Supabase client (anon key)
│   │   │   ├── server.ts               ← Server Supabase client (anon key + cookies)
│   │   │   ├── publicClient.ts         ← Cookie-free anon client — what makes ISR actually work
│   │   │   ├── admin.ts                ← Admin Supabase client (SERVICE ROLE KEY only here)
│   │   │   ├── authenticatedClient.ts  ← Self-signed-JWT client for authenticated-role RLS reads
│   │   │   ├── generated/database.types.ts  ← Real generated types, stale re: several newer
│   │   │   │                             tables/columns (see Known Issues)
│   │   │   └── migrations/             ← 41 SQL migration files (000–040, see numbering caveat)
│   │   ├── repositories/               ← Data Access Layer (only layer that calls Supabase) — 12 files
│   │   ├── services/                   ← Business Logic Layer — 13 files
│   │   ├── validations/                ← Zod schemas, one per domain
│   │   ├── integrations/               ← cloudinary/ (active), resend/ (active), sanity/ r2/
│   │   │                                 razorpay/ (stubs, not live)
│   │   ├── middleware/                 ← adminMiddleware.ts (requireAdmin), sessionMiddleware.ts
│   │   ├── utils/                      ← apiResponse.ts, errors.ts, sanitizeHtml.ts, rateLimit.ts,
│   │   │                                 sentry.ts
│   │   └── constants/
│   │
│   ├── types/                          ← Domain types, not raw Supabase-generated
│   │   ├── product.ts, cart.ts, order.ts (Order/OrderWithItems manually extended with
│   │   │   shipping_charge/tax_amount + an optional joined variant field, ahead of the
│   │   │   generated types), user.ts, coupon.ts, about.ts, settings.ts, homepage.ts
│   │
│   ├── store/                          ← Zustand — useCartStore, useWishStore, useAuthStore
│   │
│   ├── components/
│   │   ├── home/                       ← HeroBanner (carousel, dual mobile/desktop images,
│   │   │                                 focal-point picker, conditional overlay rendering),
│   │   │                                 SearchBar, CategoryCircles, StorySection, Testimonials
│   │   ├── admin/                      ← BannerPreviewPanel.tsx + shared admin UI
│   │   ├── layout/                     ← Navbar, Footer, MobileDrawer, MobileBottomNav
│   │   ├── product/, shop/, auth/, providers/, ui/
│   │
│   ├── data/
│   │   └── mockProducts.ts             ← Unused, safe to delete, not yet cleaned up
│   │
│   └── config/
│       └── env.ts                      ← Env var validation at startup
│
├── architectureFiles/                  ← Documentation for AI assistants and team
│   ├── walkthrough.md                  ← THIS FILE — project overview
│   ├── fontend.md                      ← Frontend structure overview
│   ├── handover.md                     ← New-chat session summary + current state
│   ├── systemstatus.md                 ← Detailed file inventory + live DB facts
│   ├── migration-audit.md, api-contracts.md, FIXES_APPLIED.md, and older phase reports
│
├── prompts/
│   └── Plans/                          ← One plan doc per non-trivial feature/fix this project
│       has built, each with the audit/reasoning behind it — `checkout_order_details_fixes.md`
│       is the most recent
│
├── .env.local                          ← Secrets (NOT committed to git)
├── CLAUDE.md                           ← Instructions for AI assistants
├── AGENTS.md                           ← Next.js 16 + admin-auth-stateless warnings
├── next.config.ts                      ← Image domains, CSP, security headers
└── package.json
```

---

## Architecture — Data Flow

```
Browser Request
      │
      ▼
Next.js API Route (src/app/api/)
      │ validate with Zod schema
      ▼
Service Layer (src/lib/services/)
      │ business logic — e.g. OrderService.create() now computes shipping/tax
      │ server-side from store_settings, never trusting a client-sent amount
      ▼
Repository Layer (src/lib/repositories/)
      │ Supabase queries ONLY HERE
      ▼
Supabase (PostgreSQL)
```

**Rule:** Never call Supabase from anywhere except repositories. This is enforced by code structure — not just convention.

---

## Database Schema — 27 Tables, 4 Enums, 10 RPC Functions

### Core Structure (conceptual, not literally FK-linear)

```
categories ──── products ──── product_variants ──── inventory
                     │               ├── product_images
                     │               └── inventory_logs
                     └── product_attributes

users ──── addresses ──── orders ──── order_items
      │                       ├── coupon_usage ──── coupons
      │                       └── (shipping_charge, tax_amount columns — migration 040)
      ├── carts ──── cart_items
      └── wishlists ──── wishlist_items

roles ──── user_roles ──── permissions   (RBAC foundation — not used by admin auth, which is
                                           stateless HMAC; vestigial but not removed)

homepage_sections   (banner / promo_block / featured_category CMS rows)
store_settings, admin_credentials, about_page_content   (singleton config tables — enforced via
                                                           a unique index on a constant expression)
sessions, otps, rate_limits   (service-role-only, no anon/authenticated grant at all)
```

### Enums

| Enum | Values |
|---|---|
| `product_status` | draft, active, archived |
| `order_status` | pending, confirmed, paid, processing, shipped, delivered, cancelled, refunded |
| `coupon_type` | percentage, fixed |
| `inventory_reason` | purchase, restock, adjustment, cancellation |

### RPC Functions (10)

| Function | Purpose |
|---|---|
| `decrement_stock`, `reserve_stock`, `release_stock` | Inventory adjustments |
| `create_order_transactional` | Atomic order creation — stock lock/validate, insert order+items, decrement stock, record coupon usage, all in one transaction. **Signature changed in migration 040** to accept and store `p_shipping`/`p_tax` — the old 8-arg version no longer exists |
| `increment_coupon_usage` | Coupon redemption counter |
| `check_rate_limit` | Backs `rateLimit.ts` — checkout/login abuse backstop |
| `increment_otp_attempts` | OTP infra (built, not wired into login UI) |
| `assign_admin_by_phone`, `revoke_admin_by_phone` | Phase 3 authentication helpers |
| `products_search_vector_update` | Trigger function maintaining the FTS `search_vector` column |

---

## Supabase Client Architecture

Four clients — each used in a different context:

| Client | File | Key Used | Where Used |
|---|---|---|---|
| Browser client | `src/lib/db/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend React components |
| Server client | `src/lib/db/server.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | API routes, server components that need cookies |
| Public client | `src/lib/db/publicClient.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cookie-free — public catalog reads that must stay ISR-cacheable |
| Authenticated client | `src/lib/db/authenticatedClient.ts` | Self-signed JWT (`SUPABASE_JWT_SECRET`) | Logged-in-user reads under RLS (wishlist, addresses, orders) |
| Admin client | `src/lib/db/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | Admin-only operations |

⚠️ **CRITICAL:** `SUPABASE_SERVICE_ROLE_KEY` must ONLY appear in `src/lib/db/admin.ts`. Never import it anywhere else.

⚠️ **`BYPASSRLS` (which `service_role` has) does NOT imply table-level access** — it only skips row-level policy checks. Every table `service_role` touches still needs an explicit `GRANT`. A brand-new table needs this from day one, or every service-role query against it 500s with "permission denied."

⚠️ **`server.ts` calling `cookies()` forces the entire route into dynamic rendering**, even if the cookie value is never read — this silently defeats `export const revalidate = N`. Public reads use `publicClient.ts` specifically to avoid this; confirmed fixed on `/`.

---

## Soft Deletes — read this before writing any "what's currently live" query

Most tables in this schema use `deleted_at` (nullable timestamp) for soft deletes, not a boolean `is_active` flag (categories has *both* columns, which caused real confusion this session — always filter `deleted_at IS NULL`, `is_active` alone is not enough to know if a row is "really" gone). A raw, unfiltered query against `categories` or `products` will show rows that are functionally deleted and never appear anywhere in the app. Confirmed the hard way on 2026-08-01: an unfiltered query showed 10 categories and 11 "live" products that turned out to be 8 dead category rows and 11 already-archived products once `deleted_at` was actually checked.

---

## What's Currently Working

### Storefront
✅ `npm run dev` / `npm run build` (0 TypeScript errors) / `npx tsc --noEmit`
✅ Full product catalog, real Supabase data, RLS-enforced
✅ Phone-based login/session, address book, wishlist (per-user RLS)
✅ Cart (session-based) → checkout (coupon codes, settings-driven shipping/tax) → atomic order creation
✅ Order confirmation, My Orders list, order detail with tracking stepper — all showing correct product images and correct shipping/tax totals as of this session
✅ Resend order-notification email to the store owner, now with a correct total
✅ Homepage CMS (banner carousel, promo blocks, Featured Category tiles), About Us CMS, real contact page
✅ ISR genuinely working on `/`

### Admin Platform
✅ Stateless HMAC-signed admin auth, optional DB credential override
✅ Full product CRUD (variants, images, Featured Category tagging)
✅ Real category tree (Boys/Girls today), Settings panel, About Us editor, Shopify-style banner editor
✅ Inventory, Orders, Coupons, Customers management
✅ Dashboard with SQL-aggregate metrics (no full-table scans)

### Known open issues (not fixed, see `systemstatus.md`/`handover.md` for full detail)
- Guest cart → user cart merge silently orphans items on login
- Tax-inclusive pricing policy — needs client clarification
- Estimated delivery time by pincode — new feature, needs a logic decision
- 32 live products all currently under "Girls" — data fact, tooling works fine
- OTP infra built, not wired into login UI (explicit choice)
- `database.types.ts` stale re: several newer tables/columns (workaround: manual type extension or `as any`, documented per-file)

---

## Admin Auth — Stateless, Read Before Touching

**No database user or role lookup required.**
- Login verifies `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars, or an optional `admin_credentials` override row
- Issues an HMAC-SHA256 signed `admin_token` cookie (signed with `ADMIN_PASSWORD`, 7-day TTL) — the signing secret stays the env var regardless of a credential override, so changing your login password via Settings never invalidates an already-issued session
- `requireAdmin()` in `src/lib/middleware/adminMiddleware.ts` verifies the signature inline — zero DB calls
- `AdminContext = { adminEmail: string }` — there is no `ctx.user`
- **Never** reintroduce a `user_roles`/`sessions` table lookup for admin auth

---

## How to Add a New Feature (Pattern)

### 1. Add a Zod validation schema
File: `src/lib/validations/yourSchema.ts`
```typescript
export const yourSchema = z.object({ ... })
export type YourInput = z.infer<typeof yourSchema>
```

### 2. Add a repository method
File: `src/lib/repositories/yourRepository.ts`
```typescript
async findByX(id: string): Promise<YourType> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('table').select('*').eq('id', id)
  if (error) throw new Error(error.message)
  return data
}
```

### 3. Add a service method
File: `src/lib/services/yourService.ts`
```typescript
async getX(id: string): Promise<YourType> {
  return YourRepository.findByX(id)  // orchestrate, validate business rules
}
```

### 4. Add an API route
File: `src/app/api/your-endpoint/route.ts`
```typescript
export async function GET(request: Request) {
  // validate input → call service → return ApiResponse
}
```

### 5. Verify
```bash
npx tsc --noEmit   # must stay at 0 errors
npm run build
```
Then write a small throwaway Node script hitting the real live API/DB (delete it after use, never commit it) — this project's established discipline is to confirm against real data, not just a type-check.

---

## Type System

### Supabase Types (Database)
File: `src/lib/db/generated/database.types.ts` — real generated types, but stale re: `otps`, `rate_limits`, `admin_credentials`, `store_settings`, `products.featured_category_id`, `about_page_content`, `orders.shipping_charge`/`tax_amount`. Regenerate with:
```bash
npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts
```
Until then, every affected repository either casts the client to `any` (documented per call site) or the app-level type in `src/types/` manually extends the generated `Row` type (see `order.ts`'s `Order` type for the current example).

### Domain Types (Application)
Files: `src/types/*.ts` — `product.ts`, `cart.ts`, `order.ts`, `user.ts`, `coupon.ts`, `about.ts`, `settings.ts`, `homepage.ts`.

### Zustand Store Types
- `store/useCartStore.ts` → `LocalCartItem` from `types/cart.ts`
- `store/useWishStore.ts` → `ProductSummary` from `types/product.ts`

---

## Known Issues / Technical Debt

| Issue | Where | Severity | Notes |
|---|---|---|---|
| Guest cart → user cart merge | `CartService.mergeGuestCartToUser` | Medium | Uses the anon client, which RLS scopes to guest carts only — orphans the merge |
| `database.types.ts` stale | multiple repositories | Low (workaround in place) | Gap keeps growing with each new table/column |
| Duplicate migration number `031` | `src/lib/db/migrations/` | Cosmetic | Both `031_order_tracking.sql` and `031_rls_and_permissions.sql` deployed correctly; not a reliable ordering key past 030 |
| `supabase/migrations/` gap | migrations 026–029, `031_order_tracking` | Cosmetic | No timestamped copy exists for these |
| Tax-inclusive pricing policy | checkout | Needs input | Client feedback genuinely ambiguous, not implemented |
| Estimated delivery time | checkout | New feature | No infra exists yet |
| `roles`/`permissions`/`user_roles` tables | schema | Vestigial | Admin auth is stateless HMAC now, doesn't use these; not removed |
| `src/data/mockProducts.ts` | unused | Cosmetic | Nothing imports it, safe to delete |

---

## Key Files to Read First (New Chat Session)

1. `CLAUDE.md` — instructions for this AI assistant
2. `architectureFiles/walkthrough.md` — this file
3. `architectureFiles/handover.md` — most recent session summary + current state (read this for "what just happened")
4. `architectureFiles/systemstatus.md` — detailed current-state file inventory + live DB facts
5. `AGENTS.md` — Next.js 16 breaking-changes + admin-auth-stateless warnings
6. `prompts/Plans/*.md` — one plan doc per non-trivial feature/fix, each with the full reasoning

---

## Supabase Project

| Detail | Value |
|---|---|
| Project URL | `https://jxazdoawlghbfzdmwwmu.supabase.co` |
| Project ID | `jxazdoawlghbfzdmwwmu` |
| Anon key, service role key | In `.env.local` only — never committed, never hardcoded in docs |

---

**This walkthrough is the fastest way to understand the project. Read it, then `handover.md` for what's most recent, before asking any architectural questions.**
