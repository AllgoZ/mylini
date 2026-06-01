# System Status — MYLINI v2
**Last Updated:** 2026-06-01
**Build:** ✅ `npx tsc --noEmit` = 0 errors · `npm run build` = passing
**Database:** ✅ LIVE — `jxazdoawlghbfzdmwwmu.supabase.co`
**API:** ✅ WORKING — returns real Supabase data

---

## Phase Completion

| Phase | Status |
|---|---|
| Phase 1 — Frontend UI | ✅ Complete |
| Phase 2 — Backend Foundation | ✅ Complete |
| Phase 2.1 — DB Deployment Prep | ✅ Complete |
| Phase 2.2 — Audit & Hardening | ✅ Complete |
| Phase 2.3 — Live API Validation | ✅ Complete |
| Phase 3 — Authentication | 🔲 Next |

---

## Database (Live)

| Item | Value |
|---|---|
| Project URL | `jxazdoawlghbfzdmwwmu.supabase.co` |
| Migrations applied | 23 (000–022) |
| Tables | 20 |
| Enums | 4 (product_status, order_status, coupon_type, inventory_reason) |
| RPC functions | 4 (decrement_stock, reserve_stock, release_stock, increment_coupon_usage) |
| FTS | Active (trg_products_search_vector trigger) |
| RLS | Disabled via migration 022 (Phase 2 pre-auth) |
| Seed data | 4 products · 8 variants · 8 inventory · 4 images · 12 attributes |
| TypeScript types | Generated (1042 lines, live schema) |

---

## File Inventory

### API Routes — `src/app/api/`
- `cart/route.ts` — GET, POST, PATCH, DELETE → CartService
- `categories/route.ts` — GET → CategoryService
- `orders/route.ts` — POST → OrderService
- `products/route.ts` — GET → ProductService
- `products/[slug]/route.ts` — GET → ProductService
- `wishlist/route.ts` — GET, POST → WishlistService

### Repositories — `src/lib/repositories/`
- `productRepository.ts` — products, variants, images, categories; `findVariantsByIds()` added in 2.2
- `categoryRepository.ts` — categories; in-memory tree build
- `cartRepository.ts` — carts, cart_items (session + user support)
- `wishlistRepository.ts` — wishlists, wishlist_items; `.maybeSingle()` fix in 2.2
- `inventoryRepository.ts` — inventory, inventory_logs; 3 RPC calls
- `couponRepository.ts` — coupons, coupon_usage; 1 RPC call; `.maybeSingle()` fix in 2.2
- `orderRepository.ts` — orders, order_items (snapshot fields)

### Services — `src/lib/services/`
- `productService.ts` — delegation + filter/search/pagination
- `categoryService.ts` — NEW in 2.2; delegation wrapper
- `cartService.ts` — stock validation before mutations
- `wishlistService.ts` — toggle (add/remove)
- `inventoryService.ts` — stock ops + audit logging
- `couponService.ts` — validation chain (expiry, limits, min order, user usage)
- `orderService.ts` — 8-step order creation; fixed in 2.2 (no direct Supabase)

### Validations — `src/lib/validations/`
- `productSchema.ts` — productQuerySchema (filters, pagination, search)
- `cartSchema.ts` — add/update/remove cart item schemas
- `checkoutSchema.ts` — full order creation schema
- `couponSchema.ts` — coupon validation schema
- `addressSchema.ts` — address creation schema
- `wishlistSchema.ts` — NEW in 2.2; wishlistToggleSchema

### Types — `src/types/`
- `product.ts` — Product, ProductVariant, ProductWithVariants, ProductListItem, ProductSummary, ProductFilters, PaginatedProducts, **VariantSnapshot** (new in 2.2)
- `cart.ts` — Cart, CartItem, CartWithItems, LocalCartItem
- `order.ts` — Order, OrderItem, OrderWithItems, OrderStatus, CreateOrderInput
- `user.ts` — User, Address
- `coupon.ts` — Coupon, CouponUsage, AppliedCoupon, ValidateCouponInput

### Database — `src/lib/db/`
- `client.ts` — createBrowserClient (anon key)
- `server.ts` — createServerClient (anon key + cookies)
- `admin.ts` — createAdminClient (SERVICE_ROLE_KEY only here)
- `generated/database.types.ts` — real types from live DB (1042 lines)
- `migrations/000_enable_extensions.sql` — uuid-ossp, pg_trgm, unaccent
- `migrations/001_create_enums.sql` — 4 enums (idempotent DO $$ fix)
- `migrations/002_create_categories.sql` — self-ref, soft-delete
- `migrations/003_create_products.sql` — FTS trigger + search_vector
- `migrations/004_create_product_variants.sql`
- `migrations/005_create_product_images.sql` — storage_provider, storage_key
- `migrations/006_create_product_attributes.sql` — EAV (key, value)
- `migrations/007_create_inventory.sql` — CHECK constraints, 1:1 variant
- `migrations/008_create_inventory_logs.sql` — audit trail
- `migrations/009_create_users.sql` — mirrors Supabase Auth UID
- `migrations/010_create_addresses.sql`
- `migrations/011_create_carts.sql` — XOR constraint (user OR session)
- `migrations/012_create_cart_items.sql`
- `migrations/013_create_wishlists.sql` — 1:1 per user
- `migrations/014_create_wishlist_items.sql`
- `migrations/015_create_orders.sql` — bare coupon_id (FK added in 017)
- `migrations/016_create_order_items.sql` — snapshot fields
- `migrations/017_create_coupons.sql` — ALTER TABLE orders adds FK
- `migrations/018_create_coupon_usage.sql`
- `migrations/019_create_roles.sql` — RBAC + seed 3 roles
- `migrations/020_create_search_indexes.sql` — GIN trigram + composite
- `migrations/021_create_rpc_functions.sql` — 4 SECURITY DEFINER functions
- `migrations/022_phase2_permissions.sql` — disable RLS + grant anon

### Supabase CLI — `supabase/`
- `config.toml` — local project config
- `migrations/` — 23 timestamp-named copies for `supabase db push`

### Scripts — `scripts/`
- `deploy-migrations.md` — SQL Editor step-by-step guide
- `verify-database.sql` — verification queries
- `seed.sql` — idempotent sample data (4 MYLINI products)
- `run_all_migrations.sql` — combined transactional script

### Configuration
- `src/config/env.ts` — startup env var validation
- `next.config.ts` — image domains (R2, Supabase CDN)
- `.env.local.example` — template (committed)
- `.env.local` — real secrets (gitignored)

### Integrations — `src/lib/integrations/`
- `sanity/client.ts` — stub (Phase 5)
- `r2/client.ts` — stub (Phase 7)
- `resend/client.ts` — stub (Phase 6)
- `razorpay/client.ts` — stub (Phase 4)

### Utilities — `src/lib/utils/`
- `apiResponse.ts` — successResponse(), errorResponse(), ApiResponse<T>
- `errors.ts` — AppError, NotFoundError, ValidationError, InsufficientStockError, CouponError

### Architecture Docs — `architectureFiles/`
- `walkthrough.md` — full project overview
- `handover.md` — latest session summary
- `systemstatus.md` — this file
- `fontend.md` — frontend structure
- `backend.md` — backend notes
- `api-contracts.md` — endpoint contracts + test cases
- `migration-audit.md` — schema audit
- `phase21-readiness-report.md` — readiness report
- `reports/01` through `10` — Phase 2.2 audit deliverables
- `reports/migration-deployment-audit.md` — deployment audit

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

---

## Not Built Yet

| Feature | Phase |
|---|---|
| Supabase Auth + login/signup pages | 3 |
| Protected route middleware | 3 |
| Per-user RLS policies (replaces migration 022) | 3 |
| Guest cart → user cart merge | 3 |
| Frontend wired to real API (replace mock data) | 3 |
| Razorpay payments | 4 |
| Sanity CMS | 5 |
| Resend email | 6 |
| Cloudflare R2 image uploads | 7 |
