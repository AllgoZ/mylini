@AGENTS.md

# MYLINI v2 — AI Assistant Instructions

## Rules

- ALWAYS CREATE IMPLEMENTATION PLAN when I say "create plan", and SAVE THE FILE IN `prompts\Plans`
- NEVER put `SUPABASE_SERVICE_ROLE_KEY` anywhere except `src/lib/db/admin.ts`
- NEVER commit `.env.local` or any file containing secrets
- NEVER add code, features, or abstractions not explicitly requested
- NEVER call Supabase directly from services or API routes — repositories only

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
| Phase 3B — Wishlist Enhancements | 🔲 Next |
| Phase 3.1 — OTP Verification | 🔲 Planned |
| Phase 5 — Payments (Razorpay) | 🔲 Planned |
| Phase 6 — Email (Resend) | 🔲 Planned |
| Phase 7 — Image Storage (R2) | 🔲 Planned |

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

- **25 migrations deployed** (000–024) to live Supabase project ✅
  - Migration 025: Catalog write permissions for admin operations (INSERT, UPDATE, DELETE on products, variants, images, attributes, inventory)
- **Types generated** from live schema — `src/lib/db/generated/database.types.ts` ✅
- **Seed data inserted** — 4 products, 8 variants, inventory, 3+ test users ✅
- **RLS disabled** via migration 022 (all tables); sessions table RLS disabled in migration 023
- **Admin role** seeded via migration 024 (`assign_admin_by_phone()` function)
- **Permissions granted** — anon role has GRANT SELECT + INSERT/UPDATE/DELETE on catalog tables
- Migration source: `src/lib/db/migrations/`
- CLI-formatted copies: `supabase/migrations/`

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
✅ `GET /api/wishlist` — user/session-based wishlist fetch  
✅ `GET/POST/PATCH/DELETE /api/cart` — full cart CRUD  
✅ `POST /api/orders` — complete order creation with snapshots  
✅ Frontend UI renders with Navbar, Footer, ProductGrid, ProductDetail
✅ Home page displays **Featured Collection** section showing all active products by default

### Admin Platform (Phase 4) ✅
✅ `POST /api/admin/auth/login` — email + password login with role validation  
✅ `GET /api/admin/stats` — dashboard metrics (revenue, orders, customers)  
✅ `GET /api/admin/products` — product list with search/filter  
✅ `POST /api/admin/products` — create product with variants + images (defaults to `status='active'`)  
✅ `PATCH /api/admin/products/[id]` — update product details + status  
✅ `DELETE /api/admin/products/[id]` — delete product  
✅ `GET /api/admin/inventory` — inventory list  
✅ `PATCH /api/admin/inventory/[variantId]` — adjust stock with audit logging  
✅ `/admin/login` page — email + password form with role check  
✅ `/admin` dashboard — 5 metrics + recent orders  
✅ `/admin/products/new` — full-page create with pre-save variants/images  
✅ `/admin/products/[id]/edit` — full-page edit with live variant/image management  
✅ `/admin/inventory`, `/admin/orders`, `/admin/coupons`, `/admin/customers` — all working

### Architecture
✅ All 17+ API routes structured, validated, connected to DB  
✅ 8 repositories query live database (no direct Supabase elsewhere)  
✅ 8 services contain business logic  
✅ Zod schemas in dedicated `src/lib/validations/` folder  
✅ Session table + phone-primary user identity (migration 023)  
✅ Admin role + requireAdmin() middleware (migration 024, Phase 4)

✅ Frontend pages wired to real API (removed mock-only dependency)  
❌ OTP verification — Phase 3.1  
❌ RLS policies — Phase 3B (will replace migration 022)

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

### Phase 4 Complete ✅
- Admin layout isolation via route groups
- Email + password admin login with role-based access
- Full-page product create/edit (Shopify-style)
- Migration 025 for catalog write permissions
- All 4 product form bugs fixed (visual polish, toggle alignment, input contrast, single-save flow)

### Product Query Resilience ✅ (Fixed)
- Changed category joins from INNER to LEFT (products no longer disappear if category is deleted)
- Added `categories.deleted_at IS NULL` filter (safety check)
- Products now always visible on storefront (no silent failures)

### Phase 3B (Next)
- `orderService.ts` — no PostgreSQL transaction wrapping multi-step order creation
- `src/lib/db/migrations/022` — RLS disabled; Phase 3B replaces with per-user policies
- Frontend pages — still using mock data from `src/data/mockProducts.ts` (wire in Phase 3B)

---

## Environment Variables

**IMPORTANT:** Set ALL these variables in Netlify Site Settings → Build & deploy → Environment for the demo to work.

```env
# Admin Credentials (server-side only, never exposed to browser)
ADMIN_EMAIL=admin@mylini.com
ADMIN_PASSWORD=[SET_IN_NETLIFY]

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

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

# Resend Email (Phase 8+)
RESEND_API_KEY=

# Razorpay Payments (Phase 6+)
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

**Demo Deployment on Netlify:**
1. Go to Site Settings → Build & deploy → Environment
2. Add all variables above (set actual values from `.env.local`)
3. Trigger redeploy: Deployments → Trigger deploy → Deploy site
4. Login with your admin email and password

**Note:** Never commit secrets to git. All credentials are set as Netlify environment variables. For production, use a secure secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.).

---

## Supabase CLI

Project is linked. To re-deploy or push new migrations:

```bash
SUPABASE_ACCESS_TOKEN="sbp_..." npx supabase db push --linked
```
