# MYLINI v2 — Project Walkthrough
**Last Updated:** 2026-06-08  
**Phase Completed:** Phase 5 (Performance Optimization)

---

## What Is This Project?

MYLINI v2 is a **premium Indian children's ethnic wear e-commerce platform** built on:

- **Next.js** (App Router) — server-side rendering, API routes
- **Supabase** — PostgreSQL database + Auth (Phase 3)
- **TypeScript** — fully typed, Zod validation
- **Zustand** — client-side state (cart, wishlist in browser)
- **Tailwind CSS + shadcn/ui** — UI components

---

## Phase Map

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Done | Frontend UI — 19 pages, 9 components, Zustand stores |
| Phase 2 | ✅ Done | Backend Foundation — DB schema, repos, services, API |
| Phase 2.1 | ✅ Done | DB Deployment & Verification — scripts, audits, seed data |
| Phase 2.2 | ✅ Done | Audit & Hardening — architecture violations fixed |
| Phase 2.3 | ✅ Done | Live API Validation — all endpoints tested |
| Phase 3A | ✅ Done | Phone-Identity Auth — login/session/middleware |
| Phase 3+4 | ✅ Done | CMS + Admin Platform — Homepage sections + full product mgmt |
| Phase 5 | ✅ Done | Performance Optimization — ISR caching, SQL aggregates, 20-30% faster |
| Phase 3B | 🔲 Next | Wishlist Enhancements — user persistence, cart merge, RLS |
| Phase 6 | 🔲 Planned | Payments — Razorpay integration |
| Phase 7 | 🔲 Planned | Email — Resend transactional email |
| Phase 8 | 🔲 Planned | Image Storage — Cloudflare R2 uploads |

---

## Project Directory Map

```
mylini-v2/
├── src/
│   ├── app/                        ← Next.js App Router pages
│   │   ├── api/                    ← API routes (backend)
│   │   │   ├── products/           ← GET /api/products, GET /api/products/[slug]
│   │   │   ├── categories/         ← GET /api/categories
│   │   │   ├── cart/               ← GET/POST/PATCH/DELETE /api/cart
│   │   │   ├── wishlist/           ← GET/POST /api/wishlist
│   │   │   └── orders/             ← POST /api/orders
│   │   ├── shop/                   ← Category shop pages
│   │   ├── product/                ← Product detail pages
│   │   ├── checkout/               ← Checkout flow
│   │   └── page.tsx                ← Home page (still uses mock data)
│   │
│   ├── lib/                        ← Core library (backend logic)
│   │   ├── db/
│   │   │   ├── client.ts           ← Browser Supabase client (anon key)
│   │   │   ├── server.ts           ← Server Supabase client (anon key + cookies)
│   │   │   ├── admin.ts            ← Admin Supabase client (SERVICE ROLE KEY only here)
│   │   │   ├── generated/
│   │   │   │   └── database.types.ts  ← Hand-crafted now → replace with supabase gen types
│   │   │   └── migrations/         ← 22 SQL migration files (000–021)
│   │   ├── repositories/           ← Data Access Layer (only layer that calls Supabase)
│   │   │   ├── productRepository.ts
│   │   │   ├── categoryRepository.ts
│   │   │   ├── cartRepository.ts
│   │   │   ├── wishlistRepository.ts
│   │   │   ├── inventoryRepository.ts
│   │   │   ├── couponRepository.ts
│   │   │   └── orderRepository.ts
│   │   ├── services/               ← Business Logic Layer
│   │   │   ├── productService.ts
│   │   │   ├── cartService.ts
│   │   │   ├── wishlistService.ts
│   │   │   ├── inventoryService.ts
│   │   │   ├── couponService.ts
│   │   │   └── orderService.ts
│   │   ├── validations/            ← Zod schemas (one per domain)
│   │   │   ├── productSchema.ts
│   │   │   ├── cartSchema.ts
│   │   │   ├── checkoutSchema.ts
│   │   │   ├── couponSchema.ts
│   │   │   └── addressSchema.ts
│   │   ├── integrations/           ← External service stubs (not live yet)
│   │   │   ├── sanity/
│   │   │   ├── r2/
│   │   │   ├── resend/
│   │   │   └── razorpay/
│   │   ├── utils/
│   │   │   ├── apiResponse.ts      ← Typed API response wrapper
│   │   │   └── errors.ts           ← Custom error classes
│   │   └── constants/
│   │
│   ├── types/                      ← TypeScript interfaces (not Supabase-generated)
│   │   ├── product.ts
│   │   ├── cart.ts
│   │   ├── order.ts
│   │   ├── user.ts
│   │   └── coupon.ts
│   │
│   ├── store/                      ← Zustand stores (browser-side state)
│   │   ├── useCartStore.ts         ← Local cart (guest, before auth)
│   │   └── useWishStore.ts         ← Local wishlist toggle state
│   │
│   ├── components/                 ← Shared UI components
│   │   └── ui/
│   │
│   ├── data/
│   │   └── mockProducts.ts         ← Mock data (home/shop pages still use this)
│   │
│   └── config/
│       └── env.ts                  ← Env var validation at startup
│
├── scripts/                        ← Deployment & verification scripts
│   ├── deploy-migrations.md        ← Step-by-step Supabase SQL Editor guide
│   ├── verify-database.sql         ← SQL queries to verify DB structure
│   └── seed.sql                    ← Sample MYLINI data (4 products, 8 variants)
│
├── architectureFiles/              ← Documentation for AI assistants and team
│   ├── walkthrough.md              ← THIS FILE — project overview
│   ├── fontend.md                  ← Frontend structure overview
│   ├── backend.md                  ← Backend architecture notes
│   ├── migration-audit.md          ← Migration integrity audit report
│   ├── api-contracts.md            ← API endpoint contracts + test cases
│   ├── phase21-readiness-report.md ← Readiness report (repo/service/API audit)
│   ├── systemstatus.md             ← Detailed file inventory (103 files)
│   └── handover.md                 ← New-chat context handover
│
├── prompts/                        ← Planning & reference documents
│   ├── Plans/
│   │   └── backend_foundation_plan.md ← Phase 2 implementation plan
│   ├── nextsteps/
│   │   └── NextStep.md             ← User guide for Phase 3 setup
│   └── Database_Deployment.md      ← Phase 2.1 task spec (completed)
│
├── .env.local                      ← Secrets (NOT committed to git)
├── .env.local.example              ← Template with all env var names
├── CLAUDE.md                       ← Instructions for AI assistants
├── AGENTS.md                       ← Next.js version warnings
├── next.config.ts                  ← Image domains, R2 + Supabase CDN
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
      │ business logic
      ▼
Repository Layer (src/lib/repositories/)
      │ Supabase queries ONLY HERE
      ▼
Supabase (PostgreSQL)
```

**Rule:** Never call Supabase from anywhere except repositories. This is enforced by code structure — not just convention.

---

## Database Schema — 20 Tables, 4 Enums

### Core Structure

```
categories ──── products ──── product_variants ──── inventory
                     │               └── product_images
                     └── product_attributes

users ──── addresses ──── orders ──── order_items
      │                       └── coupon_usage ──── coupons
      ├── carts ──── cart_items
      └── wishlists ──── wishlist_items

roles ──── user_roles ──── permissions
```

### Enums

| Enum | Values |
|---|---|
| `product_status` | draft, active, archived |
| `order_status` | pending, confirmed, paid, processing, shipped, delivered, cancelled, refunded |
| `coupon_type` | percentage, fixed |
| `inventory_reason` | purchase, restock, adjustment, cancellation |

---

## Supabase Client Architecture

Three clients — each used in different contexts:

| Client | File | Key Used | Where Used |
|---|---|---|---|
| Browser client | `src/lib/db/client.ts` | NEXT_PUBLIC_SUPABASE_ANON_KEY | Frontend React components |
| Server client | `src/lib/db/server.ts` | NEXT_PUBLIC_SUPABASE_ANON_KEY | API routes, server components |
| Admin client | `src/lib/db/admin.ts` | SUPABASE_SERVICE_ROLE_KEY | Admin operations only |

⚠️ **CRITICAL:** `SUPABASE_SERVICE_ROLE_KEY` must ONLY appear in `src/lib/db/admin.ts`. Never import it anywhere else. It gives full database access — exposing it is a security breach.

---

## All API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/products` | List products (filter, search, paginate) |
| GET | `/api/products/[slug]` | Single product with variants |
| GET | `/api/categories` | All categories in tree structure |
| GET | `/api/cart` | Get cart (X-Session-ID header) |
| POST | `/api/cart` | Add item to cart |
| PATCH | `/api/cart` | Update item quantity |
| DELETE | `/api/cart` | Remove item from cart |
| GET | `/api/wishlist` | Get wishlist (Authorization header) |
| POST | `/api/wishlist` | Toggle wishlist item |
| POST | `/api/orders` | Create order |

**Full contracts:** See [api-contracts.md](api-contracts.md)

---

## Migrations — 22 Files (Ready to Deploy)

All migrations in `src/lib/db/migrations/`:

| File | What It Creates |
|---|---|
| 000 | Extensions: uuid-ossp, pg_trgm, unaccent |
| 001 | 4 Enums: product_status, order_status, coupon_type, inventory_reason |
| 002 | `categories` table (self-referential, soft-delete) |
| 003 | `products` table + FTS trigger + search_vector |
| 004 | `product_variants` table (color, size, sku) |
| 005 | `product_images` table (multi-provider) |
| 006 | `product_attributes` table (EAV key-value) |
| 007 | `inventory` table (1:1 per variant, stock tracking) |
| 008 | `inventory_logs` table (audit trail) |
| 009 | `users` table (mirrors Supabase Auth) |
| 010 | `addresses` table (Indian address format) |
| 011 | `carts` table (guest XOR user constraint) |
| 012 | `cart_items` table |
| 013 | `wishlists` table (1:1 per user) |
| 014 | `wishlist_items` table |
| 015 | `orders` table (coupon_id nullable, no FK yet) |
| 016 | `order_items` table (with historical snapshots) |
| 017 | `coupons` table + **retroactive FK on orders.coupon_id** |
| 018 | `coupon_usage` table |
| 019 | `roles`, `permissions`, `user_roles` tables (RBAC foundation) |
| 020 | GIN trigram + composite listing indexes |
| 021 | 4 RPC functions: decrement/reserve/release_stock, increment_coupon_usage |

**Deploy via:** See [scripts/deploy-migrations.md](../scripts/deploy-migrations.md)

---

## What's Currently Working vs Not Working

### ✅ Working Right Now

- `npm run dev` — dev server starts
- `npm run build` — production build passes (0 TypeScript errors)
- `npx tsc --noEmit` — 0 errors
- All API routes are structured and validated
- All repositories query correct tables
- All services implement correct business logic
- Frontend UI displays (home, shop, product pages — with mock data)
- Cart/wishlist work locally (Zustand stores)

### ❌ Not Working (Needs Setup)

- API routes return errors (no Supabase connection yet)
- Cart/wishlist API endpoints fail (no database)
- Orders cannot be created (no database)
- Frontend pages show mock data, not database data

### 🔲 Not Built Yet

- Supabase Auth (Phase 3)
- User login/signup pages (Phase 3)
- Razorpay payment (Phase 4)
- Email confirmation (Phase 6)
- Image uploads to R2 (Phase 7)
- Admin dashboard (unplanned)

---

## How to Deploy the Database (First Time)

### Step 1 — Fill in `.env.local`

The file is already created. Fill in the service role key:

```env
SUPABASE_SERVICE_ROLE_KEY=  ← get from Supabase Dashboard → Settings → API → service_role secret
```

### Step 2 — Deploy migrations

Open Supabase SQL Editor and run each file in order:
- `src/lib/db/migrations/000_enable_extensions.sql`
- ... through to ...
- `src/lib/db/migrations/021_create_rpc_functions.sql`

Full guide: [scripts/deploy-migrations.md](../scripts/deploy-migrations.md)

### Step 3 — Verify

Run [scripts/verify-database.sql](../scripts/verify-database.sql) in Supabase SQL Editor. All queries should return results.

### Step 4 — Seed sample data

Run [scripts/seed.sql](../scripts/seed.sql) in Supabase SQL Editor. This inserts 4 products.

### Step 5 — Generate types

```bash
npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts
```

### Step 6 — Test

```bash
npm run dev
# Open: http://localhost:3000/api/products
# Should return: {"data": {"items": [...], "count": 4}, "error": null}
```

---

## How to Add a New Feature (Pattern)

Follow this exact pattern (clean architecture):

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

---

## Type System

### Supabase Types (Database)
File: `src/lib/db/generated/database.types.ts`
- Currently: hand-crafted placeholder
- After migration: replace with `npx supabase gen types typescript`
- Provides `Database['public']['Tables']['tablename']['Row|Insert|Update']`

### Domain Types (Application)
Files: `src/types/*.ts`
- `product.ts` — Product, ProductVariant, ProductWithVariants, ProductFilters, etc.
- `cart.ts` — Cart, CartItem, CartWithItems, LocalCartItem
- `order.ts` — Order, OrderItem, OrderWithItems, OrderStatus
- `user.ts` — User, Address
- `coupon.ts` — Coupon, CouponType

### Zustand Store Types
- `store/useCartStore.ts` → uses `LocalCartItem` from `types/cart.ts`
- `store/useWishStore.ts` → uses `ProductSummary` from `types/product.ts`

---

## Known Issues / Technical Debt

| Issue | Where | Severity | Phase to Fix |
|---|---|---|---|
| No PostgreSQL transaction on order creation | `orderService.ts` | Medium | Phase 3 |
| Direct Supabase query in service layer | `orderService.ts` (variant snapshot fetch) | Low | Phase 3 |
| No CategoryService (route calls repo directly) | `api/categories/route.ts` | Low | Phase 3 |
| Inline Zod schema in wishlist route | `api/wishlist/route.ts` | Low | Phase 3 |
| `as any` casts in repositories | all 7 repos | Low (intentional) | Resolves after type gen |
| Frontend uses mock data | home/shop/product pages | High (functional) | Phase 3 |
| No RLS policies | all tables | High (security) | Phase 3 |

---

## Key Files to Read First (New Chat Session)

1. `CLAUDE.md` — instructions for this AI assistant
2. `architectureFiles/walkthrough.md` — this file
3. `architectureFiles/systemstatus.md` — detailed file inventory
4. `architectureFiles/migration-audit.md` — database structure
5. `architectureFiles/handover.md` — last session summary
6. `prompts/nextsteps/NextStep.md` — what to do next (Phase 3 guide)

---

## Supabase Project

| Detail | Value |
|---|---|
| Project URL | https://jxazdoawlghbfzdmwwmu.supabase.co |
| Project ID | `jxazdoawlghbfzdmwwmu` |
| Region | (your region) |
| Anon key | sb_publishable_mZEvGayJmorigrGhcrIYzA_eGfL3QVo |
| Service role key | In `.env.local` only — never committed |

---

**This walkthrough is the fastest way to understand the project. Read it before asking any architectural questions.**
