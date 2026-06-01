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
| Phase 3 | 🔲 Next | Authentication — Supabase Auth, login/signup |
| Phase 4 | 🔲 Planned | Payments — Razorpay |
| Phase 5 | 🔲 Planned | CMS — Sanity |
| Phase 6 | 🔲 Planned | Email — Resend |
| Phase 7 | 🔲 Planned | Image storage — Cloudflare R2 |

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

The database is already deployed. To redeploy from scratch:

```bash
# 1. Apply all 23 migrations (see scripts/deploy-migrations.md for step-by-step)
# 2. Generate TypeScript types from the live schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/db/generated/database.types.ts

# 3. Verify TypeScript is still clean
npx tsc --noEmit

# 4. Seed sample data (optional — see scripts/seed.sql)
```

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

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List products (filter, search, paginate) |
| GET | `/api/products/[slug]` | Product detail with variants |
| GET | `/api/categories` | Category tree |
| GET/POST/PATCH/DELETE | `/api/cart` | Cart management |
| GET/POST | `/api/wishlist` | Wishlist toggle |
| POST | `/api/orders` | Create order |

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
- `api-contracts.md` — API endpoint contracts and test cases
- `migration-audit.md` — Database schema audit
- `reports/` — Phase 2.2 audit reports (10 files)
- `handover.md` — Latest session summary
- `systemstatus.md` — Detailed file inventory
