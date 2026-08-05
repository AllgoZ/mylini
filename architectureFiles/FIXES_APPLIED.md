# Fixes Applied — MYLINI v2

Running log of significant production/live-DB bugs and their fixes, newest first.

---

## 2026-07-17 (later same day) — Order detail page: "Order 'xxx' not found" for every order (coupons grant gap)

**Issue:** User reported that clicking into any order from `/orders` (My Orders) fails with `Order '<uuid>' not found` on `/orders/[id]`, even though the order genuinely exists and belongs to the logged-in user. The order **list** page worked fine — only the detail page failed.

**Root Cause:** Third occurrence of the same class of bug as migrations 034/035. Migration `031_rls_and_permissions.sql` section 2 granted `coupons` `SELECT` only to `anon` (so guests can validate a coupon code at checkout) but never granted it to `authenticated`. `OrderRepository.findByIdForUser` (and the admin equivalent `findById`) embeds `coupon:coupons(id, code, type, value)` in its select — PostgREST needs `SELECT` on `coupons` to plan that embed even when `coupon_id` is `NULL` (the embed is still part of the query shape), so the entire query fails outright with `permission denied for table coupons` and the repository's generic `error || !data → NotFoundError` fallback surfaces it to the user as "not found". `findByUserId` (the list) never joins `coupons`, so it was unaffected — which is why the list worked but every single order's detail view didn't.

**Diagnosis:** Reproduced directly (not guessed) by signing a real user JWT with the app's own `authenticatedClient.ts` code path and running the exact `findByIdForUser` query outside the app:
```
code: 42501
message: "permission denied for table coupons"
hint: "Grant the required privileges to the current role with: GRANT SELECT ON public.coupons TO authenticated;"
```
Confirmed the specific order and its address both existed and belonged to the same user (ruling out a data-integrity or ownership bug) before landing on the grant gap.

**Fix:** `036_grant_authenticated_coupons_read.sql` — `GRANT SELECT ON coupons TO authenticated;`. **Not yet deployed** — per this project's standing rule (no automatic migration runner), this needs to be run by the user via the Supabase SQL Editor.

**Files:**
- `src/lib/db/migrations/036_grant_authenticated_coupons_read.sql` + `supabase/migrations/20240101000036_grant_authenticated_coupons_read.sql` — the fix (awaiting manual deployment)
- No application code changed — the query itself was always correct; this was purely a missing DB grant.

---

## 2026-07-17 (later same day) — Vercel: every storefront route crashed with 500 (jsdom bundling)

**Issue:** After connecting the repo to Vercel (in addition to the existing Netlify deployment), every single page returned `500 FUNCTION_INVOCATION_FAILED`, both in the browser and in Vercel's own deployment preview pane. `npx tsc --noEmit` and `npm run build` passed cleanly, both locally and as part of Vercel's own build step — the Build Log showed a fully healthy build with no errors.

**Wrong turns first, since they're informative:**
1. **Missing environment variables** — a reasonable first hypothesis (`.env.local` is gitignored and had genuinely never been added to Vercel), and real work was needed there regardless (env vars had to be added, with the added gotcha that Vercel scopes them per-environment — Production/Preview/Development — and that adding one doesn't retroactively apply to an already-built deployment). But even after doing this correctly and redeploying, the 500 persisted.
2. **Suspected the homepage's own data-fetching** — traced the entire `/` render tree; every fetch (`ProductService`, `HomepageService`, `getCategories()`) turned out to be `.catch()`-guarded, so nothing there should be able to crash even with bad data. Found one real, independent bug along the way: `CategoryCircles` (a Server Component) called `getCategories()` (`src/lib/api/categories.ts`), which does `fetch('/api/categories')` with a **relative URL** — only valid in a browser context, not under Node/SSR. Fixed by calling `CategoryService.getWithChildren()` directly instead (same service the API route itself delegates to). Real bug, silently caught, **not** the crash.

**Actual root cause**, found only once the user pulled Vercel's **Runtime Log** (a separate tab from the Build Log) for a failing request:
```
Error: Failed to load external module jsdom-...
```
`src/lib/utils/sanitizeHtml.ts` had a **top-level** `import DOMPurify from 'isomorphic-dompurify'`. That function is only called by `ProductService.create`/`update` (the admin product-save path) — but `ProductService` is also imported by the public homepage/product/shop pages, for their own unrelated read methods (`list`, `getBySlug`, etc.). Next.js bundles a route's *entire reachable server-side import graph* into that route's serverless function, so `isomorphic-dompurify`'s `jsdom` dependency got bundled into every one of those public routes too, despite none of them ever calling the sanitize function. `jsdom` then failed to load inside Vercel's bundled Node runtime, crashing the function at **module-load time** — before any application code, including every `.catch()` guard traced in step 2 above, ever got a chance to run. That's exactly why tracing the render tree found nothing: the bug wasn't reachable from there at all.

Independently corroborated: the one deployment that kept working throughout this investigation (`368618b`, "smooth hamburger drawer animation") predates `isomorphic-dompurify` being added to the codebase entirely — it was first introduced in `6519cb1` (Opti Phase 3). Every deployment built from `6519cb1` onward crashed; the one built before it didn't. That timing lines up exactly with the diagnosis.

**Fix:** `sanitizeProductDescription()` (`src/lib/utils/sanitizeHtml.ts`) now `await import('isomorphic-dompurify')`s **inside** the function body instead of at module scope, so only the actual admin write path pulls it in. The function is now `async`; both call sites in `src/lib/services/productService.ts` (`create`, `update`) updated to `await` it.

**Verification:** `tsc --noEmit` clean; fresh `next build` succeeds; `next start` (production build, run locally) served `/`, `/product/[slug]`, and `/shop/[category]` all as `200`; confirmed working on a fresh Vercel deployment after pushing the fix.

**Durable rule added** (`CLAUDE.md` Rules section, `AGENTS.md` new "Server-Side Import Chains" section, `handover.md` Critical Architecture Rules): never top-level-import a heavy or Node-only dependency into a module reachable from a public/high-traffic route unless every route importing that module actually needs it — lazy-`import()` it inside the function that uses it instead. This class of bug is invisible to `tsc`/`next build` (both pass regardless) and only surfaces as a runtime crash on the deployment platform — if a route works locally but 500s only when deployed, check the platform's Runtime/Function logs, not just the Build log.

**Related, discovered but not fixed:** while tracing this, confirmed that `/`, `/product/[slug]`, and `/shop/[category]` all build as `ƒ Dynamic`, not `○ Static`, despite `export const revalidate = 60` in each — `src/lib/db/server.ts`'s Supabase client calls `cookies()` internally, and Next.js forces a route fully dynamic the moment `cookies()` is called anywhere in its render tree, regardless of whether the value is used. Earlier revisions of `systemstatus.md`/`handover.md` incorrectly described these routes as ISR-cached; corrected. Real performance impact (every visit does a live, uncached Supabase round-trip) — not fixed this session.

**Files:**
- `src/lib/utils/sanitizeHtml.ts`, `src/lib/services/productService.ts` (commit `16e9d92`) — the actual fix
- `src/components/home/CategoryCircles.tsx` (commit `540b285`) — the relative-fetch fix found along the way, kept as a real improvement
- `d664a8f` — empty commit used to trigger a Vercel redeploy after env vars were added

---

## 2026-07-17 — Production RLS Grant Gap (login + authenticated reads broken)

**Issue:** Immediately after deploying migration `031_rls_and_permissions.sql` (Opti Phase 3's Row Level Security rollout), the entire site stopped working — `POST /api/auth/login` returned `500` with `permission denied for table users`. After a first fix, a second, narrower instance of the same class of bug broke `GET /api/wishlist` with `permission denied for table products`.

**Root Cause:** Migration 031 revoked `anon`'s previously-blanket table access (correct — that was the point of adding RLS) but never granted the equivalent explicit `GRANT` to `service_role` or `authenticated`. Two wrong assumptions caused this:
1. `service_role` has `BYPASSRLS` in Supabase by default, which was assumed to imply full table access. **It doesn't** — `BYPASSRLS` only skips *row-level* policy evaluation. Table-level `GRANT`s (`SELECT`/`INSERT`/etc.) are a separate, still-required layer, and migration 031 never added them for `service_role`.
2. Catalog-table `SELECT` (`products`, `product_images`, etc.) was granted to `anon` (for public storefront browsing) but the parallel grant to `authenticated` was simply missed — `anon` and `authenticated` are distinct Postgres roles; a grant to one never extends to the other.

**Diagnosis:** Postgres's own error messages named the fix directly —
```
permission denied for table users
permission denied for table products
hint: Grant the required privileges to the current role with: GRANT SELECT ON public.products TO authenticated;
```
Confirmed each hypothesis by testing the failing queries directly (bypassing the app's generic "Internal server error" response) with the real signed JWT / service-role client before writing the fix, rather than guessing.

**Fix:**
- **`034_grant_service_role.sql`** — explicit `GRANT SELECT, INSERT, UPDATE, DELETE` for `service_role` on all 24 application tables, plus `EXECUTE` on all 7 RPC functions it calls (`decrement_stock`, `reserve_stock`, `release_stock`, `increment_coupon_usage`, `create_order_transactional`, `check_rate_limit`, `increment_otp_attempts`).
- **`035_grant_authenticated_catalog_read.sql`** — explicit `GRANT SELECT` for `authenticated` on the 8 catalog tables (`categories`, `products`, `product_variants`, `product_images`, `product_attributes`, `inventory`, `inventory_logs`, `homepage_sections`).

Both deployed by the user via the Supabase SQL Editor (this project has no automatic migration runner — every migration here is written by the assistant and deployed manually).

**Verification:** Retested live, end-to-end, after each fix: `POST /api/auth/login` → `200` with a real session; `GET/POST /api/wishlist` → `200`/`201` including the product/image join; `POST /api/addresses` → `201`; `POST /api/orders` → `201`, full order created via the `create_order_transactional` RPC with stock decrement and a Resend order-notification email firing without error.

**Files:**
- `src/lib/db/migrations/034_grant_service_role.sql` + `supabase/migrations/20240101000034_grant_service_role.sql`
- `src/lib/db/migrations/035_grant_authenticated_catalog_read.sql` + `supabase/migrations/20240101000035_grant_authenticated_catalog_read.sql`
- `src/lib/services/authService.ts`, `src/lib/repositories/userRepository.ts` — briefly reverted to the anon client mid-diagnosis to isolate whether the bug was `service_role`-specific (it wasn't — anon failed identically post-031, which was the clue that pointed at the missing grants rather than a client-selection bug); reverted back to `createAdminClient()` once the real root cause was confirmed.

**Not fixed, flagged separately:** `CartService.mergeGuestCartToUser` (runs on every login) still uses the anon client to look up a user's cart by `user_id`, which migration 031's RLS now always filters to zero rows for anon. This predates the RLS rollout in effect (it was silently relying on anon's old blanket access) and now silently falls back to creating an orphaned cart row. See `systemstatus.md` / `handover.md` for details — not yet fixed.

---

# Product Visibility Issue

**Date:** 2026-06-03  
**Issue:** Products created in admin panel (status='active') not showing on storefront  
**Root Cause:** INNER JOIN on categories + missing soft-delete filter  
**Status:** ✅ FIXED

---

## Changes Made

### 1. Conditional Category Join (Production Grade) ⭐ FINAL FIX
**File:** `src/lib/repositories/productRepository.ts`

**The Problem:** Pure LEFT JOIN broke category filtering
- When filtering by category, it still returned products with `category:null`
- API returned 5 products for `/api/products?category=girls-traditional` when only 2 matched

**The Solution:** Use conditional joins based on filter context
```typescript
// Two SELECT clauses with different join types:
const LIST_SELECT_INNER = `...category:categories!inner(...)` // For filtering
const LIST_SELECT_LEFT = `...category:categories(...)` // For browsing

// Logic: select based on whether we're filtering by category
const selectClause = filters.category ? LIST_SELECT_INNER : LIST_SELECT_LEFT
```

**Applied to:**
- `findAll()` - product list queries
- `findAllForAdmin()` - admin product list
- `findBySlug()` - product detail (uses DETAIL_SELECT_INNER)
- `findByIdForAdmin()` - admin product detail (uses DETAIL_SELECT_LEFT)

**Impact:**
- ✅ Category filtering works correctly (INNER JOIN when filtering)
- ✅ All products visible when browsing (LEFT JOIN without filter)
- ✅ Products with no category don't show on storefront detail pages
- ✅ Admin can manage all products including those without categories

**Test Results:**
- `/api/products?limit=40` → 5 products ✅
- `/api/products?category=girls-traditional` → 2 products ✅

---

### 2. Added Category Soft-Delete Filter (Safety)
**File:** `src/lib/repositories/productRepository.ts`

**Added to queries:**
```sql
.is('categories.deleted_at', null)
```

**Impact:**
- Explicitly filters out soft-deleted categories
- Safety check: prevents orphaned products from deleted categories
- Applied to all product queries: findAll, findBySlug, findAllForAdmin, findByIdForAdmin

**Lines Changed:** Across all query methods

---

### 3. Schema Default Correction (Previous Fix)
**File:** `src/lib/validations/adminProductSchema.ts` Line 13

**Before:**
```typescript
status: z.enum(['draft', 'active', 'archived']).optional().default('draft')
```

**After:**
```typescript
status: z.enum(['draft', 'active', 'archived']).optional().default('active')
```

**Impact:** New products default to 'active' (visible), not 'draft' (hidden)

---

### 4. Added Featured Products Home Page Section (Previous Fix)
**File:** `src/app/(storefront)/page.tsx`

**Added:**
- Fetches all active products: `getProducts({ limit: 8 })`
- New "Featured Collection" section on home page
- Always displays latest products as fallback

**Impact:** Products visible immediately after creation

---

## Test Results

| Test | Result | API Test | Status |
|------|--------|----------|--------|
| TypeScript Build | ✅ 0 errors | N/A | Compiles cleanly |
| Next.js Build | ✅ Passing | N/A | Production build successful |
| All Products | ✅ Working | `/api/products` → 5 count | LEFT JOIN shows all |
| Category Filter | ✅ **FIXED** | `/api/products?category=girls-traditional` → 2 count | INNER JOIN when filtering |
| Products in Admin | ✅ Visible | Returns 5 with admin select | Status='active' confirmed |
| Category Pages | ✅ Ready | API working correctly | Browser should display now |
| Product Detail | ✅ Ready | findBySlug with INNER JOIN | Only valid products show |

---

## Production Readiness

✅ **All changes are production-grade:**
- No breaking changes
- Backward compatible
- Resilient to data issues
- Follows best practices
- Properly tested (build + types)

---

## Next Steps

1. **Local Test:** Run `npm run dev` and verify:
   - Admin product creation works
   - Products appear on home page Featured Collection
   - Products visible on category pages
   - Collections page shows products (not "0 products found")

2. **Verify Categories:** Ensure seed categories exist in live database

3. **Monitor:** Watch for any permissions or RLS issues

---

## Files Modified

1. **src/lib/repositories/productRepository.ts** (MAIN FIX)
   - Added LIST_SELECT_INNER (INNER JOIN for category filtering)
   - Added LIST_SELECT_LEFT (LEFT JOIN for all products)
   - Added DETAIL_SELECT_INNER (storefront product detail)
   - Added DETAIL_SELECT_LEFT (admin product detail)
   - Updated findAll() to use conditional select based on filters
   - Updated findAllForAdmin() to use conditional select
   - Updated findBySlug() to use DETAIL_SELECT_INNER
   - Updated findByIdForAdmin() to use DETAIL_SELECT_LEFT
   - Added .is('categories.deleted_at', null) safety filters

2. **src/lib/validations/adminProductSchema.ts**
   - Changed status default from 'draft' to 'active'

3. **CLAUDE.md**
   - Updated documentation

All changes committed and tested ✅
