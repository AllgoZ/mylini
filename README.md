# MYLINI v2

Premium Indian children's ethnic wear e-commerce platform.

## Tech Stack

- **Next.js 16** (App Router) — React 19, TypeScript
- **Supabase** — PostgreSQL database + Auth (Phase 3)
- **Tailwind CSS** + shadcn/ui — UI components
- **Zustand** — Client-side state (cart, wishlist)
- **Zod** — Input validation
- **Vercel / Netlify** — Deployment

## Current Status

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Done | Frontend UI — pages, components, Zustand stores |
| Phase 2 | ✅ Done | Backend foundation — DB schema, repos, services, API |
| Phase 2.1 | ✅ Done | DB deployment — migrations applied, types generated |
| Phase 2.2 | ✅ Done | Audit & hardening — architecture violations fixed |
| Phase 2.3 | ✅ Done | Live API validation — all endpoints tested |
| Phase 3A | ✅ Done | Phone-identity auth — login/session/middleware |
| Phase 3+4 | ✅ Done | CMS + Admin platform — Homepage sections + full product mgmt |
| Phase 5 | ✅ Done | Performance optimization — ISR caching, SQL aggregates, 20-30% faster |
| Phase 3B | 🔲 Next | Wishlist enhancements — user persistence, cart merge, RLS |
| Phase 6+ | 🔲 Planned | Payments (Razorpay), Email (Resend), Image Storage (R2) |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))

### Setup

```bash
# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.local.example .env.local
# Edit .env.local — add your Supabase URL, anon key, and service role key

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Setup

The database is already deployed with **29 migrations** live on Supabase. To redeploy from scratch:

```bash
# 1. Apply all 29 migrations (000–028, see scripts/deploy-migrations.md for step-by-step)
# 2. Generate TypeScript types from the live schema
npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts

# 3. Verify TypeScript is still clean
npx tsc --noEmit

# 4. Seed sample data (optional — see scripts/seed.sql)
```

**Recent migrations:**
- Migration 025: Admin catalog write permissions
- Migration 026–028: Product schema extensions (dimensions, barcode, type, tags, tax)
- Migration 029: Homepage CMS (banner, promo_blocks, featured_categories)

## Project Structure

```
src/
├── app/
│   ├── api/              ← API routes (products, cart, wishlist, orders, categories)
│   └── [pages]/          ← Frontend pages (home, shop, product, cart, checkout)
├── lib/
│   ├── db/               ← Supabase clients + 23 SQL migrations
│   ├── repositories/     ← Data access layer (only place Supabase is called)
│   ├── services/         ← Business logic
│   └── validations/      ← Zod schemas
├── types/                ← Domain TypeScript types
└── store/                ← Zustand stores (cart, wishlist)

supabase/
└── migrations/           ← Timestamped copies for Supabase CLI

scripts/
├── deploy-migrations.md  ← Step-by-step deployment guide
├── verify-database.sql   ← Verification queries
└── seed.sql              ← Sample MYLINI products
```

## API Endpoints

### Storefront
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List products (filter, search, paginate, ISR cached) |
| GET | `/api/products/[slug]` | Product detail with variants (ISR cached) |
| GET | `/api/categories` | Category tree with hierarchy |
| GET | `/api/products/filters` | Filter metadata (sizes, types, tags, prices) |
| GET/POST/PATCH/DELETE | `/api/cart` | Cart management (session-based) |
| GET/POST | `/api/wishlist` | Wishlist toggle (user/session) |
| POST | `/api/orders` | Create order with snapshots |

### Admin (requires email+password login)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/auth/login` | Admin authentication |
| GET | `/api/admin/stats` | Dashboard metrics (SQL aggregates) |
| GET/POST/PATCH/DELETE | `/api/admin/products/[id]` | Product management |
| GET/POST | `/api/admin/products/[id]/variants` | Variant management |
| GET/POST/DELETE | `/api/admin/products/[id]/images` | Image management |
| GET/PATCH | `/api/admin/inventory/[variantId]` | Stock adjustment + audit log |
| GET/POST/PATCH/DELETE | `/api/admin/orders/[id]` | Order management |
| GET/POST/PATCH/DELETE | `/api/admin/coupons` | Coupon management |
| GET | `/api/admin/customers` | Customer analytics |
| POST | `/api/admin/content/*` | CMS content endpoints |
| POST | `/api/admin/upload/cms` | CMS image upload |

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

See `.env.local.example` for all optional variables (R2, Sanity, Resend, Razorpay).

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npx tsc --noEmit     # TypeScript check (should always be 0 errors)
npm run lint         # ESLint
```

## Architecture

```
Request → API Route → Zod validation → Service → Repository → Supabase
```

**Rule:** Only repositories call Supabase. Services handle business logic. Routes validate and delegate.

## Documentation

All architecture docs are in `architectureFiles/`:

- `walkthrough.md` — Full project overview
- `systemstatus.md` — Detailed file inventory & phase progress
- `handover.md` — Latest session summary (Phase 5 optimization)
- `fontend.md` — Frontend architecture & components
- `backend.md` — Backend structure & migrations
- `api-contracts.md` — API endpoint contracts and test cases
- `migration-audit.md` — Database schema audit (29 migrations)
- `phase5-performance-optimizations.md` — Performance audit & fixes (20-30% faster)
- `FIXES_APPLIED.md` — Product visibility fixes (Phase 4)
