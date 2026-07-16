# MYLINI Performance & Architecture Audit — Results
**Audit spec:** `optimize_audit.md`
**Status:** COMPLETE — all 18 sections filled in
**Method:** Every finding below is verified against actual source files in this repo (file path + line numbers cited). No code was changed as part of this audit. Where evidence is insufficient, it is explicitly marked "Not enough evidence."

---

## Table of Contents
1. [Project Architecture Audit](#section-1--project-architecture-audit) — ✅ done
2. [Supabase Audit](#section-2--supabase-audit) — ✅ done
3. [Supabase Cost Optimization / Caching](#section-3--supabase-cost-optimization--caching-strategy) — ✅ done
4. [Database Design](#section-4--database-design) — ✅ done
5. [Next.js Performance Audit](#section-5--nextjs-performance-audit) — ✅ done
6. [React Performance](#section-6--react-performance) — ✅ done
7. [Image Performance](#section-7--image-performance) — ✅ done
8. [Network Performance](#section-8--network-performance) — ✅ done
9. [State Management (Zustand)](#section-9--state-management-zustand) — ✅ done
10. [Shopping Experience](#section-10--shopping-experience) — ✅ done
11. [Mobile Performance](#section-11--mobile-performance) — ✅ done
12. [Bundle Analysis](#section-12--bundle-analysis) — ✅ done
13. [Core Web Vitals](#section-13--core-web-vitals) — ✅ done
14. [User Experience / Predictive Loading](#section-14--user-experience--predictive-loading) — ✅ done
15. [Security](#section-15--security) — ✅ done
16. [Scalability](#section-16--scalability) — ✅ done
17. [Final Scorecard](#section-17--final-scorecard) — ✅ done
18. [Action Plan](#section-18--action-plan) — ✅ done

---

## Section 2 — Supabase Audit

**This is confirmed the most important section, and it surfaces the single highest-impact finding of the whole audit: a real, sequential N+1 pattern in order creation.**

### 🔴 Critical: Sequential N+1 in `OrderService.create()`

File: `src/lib/services/orderService.ts:14-100`, compounded by `src/lib/services/inventoryService.ts:20-29`.

Order creation loops over cart items **twice**, both times with `await` inside a `for` loop (not `Promise.all`):

```ts
// orderService.ts:21-26 — stock validation, one round trip PER ITEM, sequential
for (const item of items) {
  const inventory = await InventoryRepository.findByVariantId(item.variant_id)
  ...
}
...
// orderService.ts:89-91 — stock decrement, one call PER ITEM, sequential
for (const item of items) {
  await InventoryService.decrementStock(item.variant_id, item.quantity)
}
```

`InventoryService.decrementStock()` (`inventoryService.ts:20-29`) is itself **three sequential Supabase round trips per call**: `findByVariantId` (SELECT) → `decrementStock` (RPC) → `logChange` (INSERT).

**Net effect per order with N line items:** N round trips (validation) + 3N round trips (decrement: select+rpc+insert) + up to 2 more sequential round trips if a coupon is applied (`CouponRepository.recordUsage` then `incrementUsage`, `orderService.ts:95-96`, also not parallelized) = **4N + 2 sequential Supabase round trips**, none of them parallelized, all inside a single API request.

For a realistic 3-item order, that's **~14 sequential round trips** before the response returns. At Supabase's typical 50–150ms round-trip latency (region-dependent), that alone is **0.7–2.1 seconds of pure network wait added to checkout latency**, before any other processing. This is the mechanism, not a guess — it's a direct reading of the `for`-loop + multi-step service code.

**Why this matters for the stated scale target (1000+ daily orders, 50 orders/minute):** at 50 orders/minute with ~3 items each, this is ~150 sequential inventory round trips/minute purely from this code path, and each order-creation request holds its connection/serverless invocation open for the full sequential chain. This is very likely to become the first checkout bottleneck under load — worth treating as Priority 1 (see Section 18).

**Also relevant:** `handover.md`'s own "Known Technical Debt" table already flags "No PostgreSQL transaction on order creation" as Medium severity — this audit confirms that gap and adds the specific N+1 mechanism, which is a distinct (and more immediately measurable) problem from the missing-transaction one. Fixing the transaction (wrapping steps 5–8 in one RPC) would also fix the N+1, since a single `plpgsql` function could loop over items server-side in one round trip.

### 🟡 Other duplicate/inefficient query patterns found

- **Home page issues 5 separate Supabase round trips per render** (`src/app/(storefront)/page.tsx:33-39`): three separate `ProductService.list()` calls (best sellers, new arrivals, featured — each a full `products` query with category+image joins) plus two separate `HomepageService.getByType()` calls (`'banner'`, `'promo_block'`). The two homepage-section calls filter the same table by a different value of the same column (`section_type`) and could be merged into one `.in('section_type', ['banner','promo_block'])` call. All 5 are at least parallelized via `Promise.all` (good), and the page carries `revalidate = 60` (ISR), so this cost is paid once per 60s per cache key, not per visitor — but it's still 5 DB round trips per cache miss where 4 would do.
- **Shop category page can trigger up to ~6 Supabase round trips per cache miss** (`productRepository.ts` — `findAll` + `getFilterMetadata`): the main listing query, plus inside `getFilterMetadata` (`productRepository.ts:160-249`): a product-id/price/tag query, a variant-size query (only if any products matched), and for category navigation — a category lookup, then either a children query or a *parallel* parent+siblings query. Also ISR-cached at 60s, so amortized, but each unique category+filter URL is its own cache key, so high filter-combination traffic (price/size/tag combos aren't part of the revalidate key differentiation — worth double-checking Next's ISR caching granularity for query-string variations) could multiply this.
- **Size filtering does a separate lookup before the main query** (`productRepository.ts:80-90`): when `filters.size` is set, a `product_variants` query resolves matching `product_id`s first, then the main query does `.in('id', ids)`. This is a legitimate PostgREST limitation workaround (can't filter parent rows by nested-relation columns in one call easily), not a bug, but it is an extra round trip on every size-filtered request.
- **"Find or create" patterns cost 2 round trips instead of 1** in two places: `CartRepository.findOrCreateBySession` (`cartRepository.ts:14-34`) and `WishlistRepository.findOrCreateByUserId` (`wishlistRepository.ts:5-25`) both do a `SELECT ... .single()` (which errors internally if no row exists, swallowed by destructuring) followed by a conditional `INSERT`. A single `upsert` with `onConflict` would collapse this to one round trip. This runs on every first-time guest cart touch and every first-time wishlist touch.
- **No request-level query memoization.** Every repository method calls `await createClient()` fresh (`server.ts:5-28` creates a new `createServerClient` instance per call) with no `React.cache()` wrapper around repository reads. Not observed as an actual duplicate-fetch bug in the pages reviewed (each Server Component fetches each piece of data once), but there is no safety net if two components in the same request tree end up requesting the same data — it would be fetched twice with no dedup.

### 🟢 What's genuinely well-optimized (confirmed by reading the code, not just trusting the docs)

- `CartRepository.getWithItems` (`cartRepository.ts:46-86`) does the cart + items + variant + product + images fetch as **one** nested PostgREST query — the code comment ("was 2 sequential round-trips") matches what's actually in the file. Verified, not just claimed.
- Image relations (`productRepository`, `inventoryRepository`, `wishlistRepository`, `cartRepository`) are consistently resolved via PostgREST embedded selects (`images:product_images(...)`) rather than N+1 loops in application code — this is the correct pattern and is used consistently across every repository reviewed.
- `AdminStatsService.getDashboardStats()` (`adminStatsService.ts:20-28`) issues 7 aggregate queries (`select('total.sum()')`, `count: 'exact', head: true`) fully in parallel via `Promise.all`, with no full-table row fetch — matches the "SQL aggregates, no full-table scan" claim in `systemstatus.md`. Confirmed correct.
- `InventoryRepository.findAll()` (`inventoryRepository.ts:61-95`) pushes the primary-image filter to the database (`.eq('product_variants.products.product_images.is_primary', true)`) instead of fetching all images and filtering client-side — confirmed correct, matches the Phase 5 claim.
- Explicit column selects are used almost everywhere (`LIST_SELECT_INNER/LEFT` in `productRepository.ts`, targeted selects in `orderRepository.findByUserId`/`findAll`) — no `select('*')` found on list endpoints. `select('*')` does appear on single-row detail fetches (`DETAIL_SELECT_INNER/LEFT`, `CouponRepository.findByCode`, `InventoryRepository.findByVariantId`) — acceptable for single-row reads, not a scaling concern.

### Estimates (code-derived, not measured — Supabase dashboard metrics were not available to this audit)

| Metric | Estimate | Basis |
|---|---|---|
| Reads per home page cache-miss | 5 Supabase round trips | Direct count of calls in `page.tsx:33-39` |
| Reads per shop category cache-miss | up to 6 round trips | `findAll` + up to 5 inside `getFilterMetadata` |
| Round trips per order created | **4N + 2** (N = item count) | Direct count of sequential loop iterations in `orderService.ts` + `inventoryService.ts` |
| Reads saved by home banner/promo merge | 1 round trip per cache miss | Merging two `.eq('section_type', ...)` calls into one `.in(...)` |
| Reads saved by cart/wishlist upsert fix | 1 round trip per first-time guest/user touch | Collapsing select+insert into a single upsert |
| Latency reduction from fixing order N+1 | Not enough evidence to give a precise number without a real Supabase region/latency measurement — but structurally, converting the 4N+2 sequential round trips into 1 RPC call would cut order-creation network wait by roughly (4N+1)/(4N+2), i.e. the vast majority of it | Structural analysis of the current code path |

---

## Section 3 — Supabase Cost Optimization / Caching Strategy

### What's already in place (verified)

| Cache layer | Where used | Verified in |
|---|---|---|
| Next.js ISR (`revalidate = 60`) | Home, shop/[category], product/[slug] | `page.tsx` files — `export const revalidate = 60` present in all three, confirmed by direct read |
| In-store guard (avoid refetch) | Cart badge in `Navbar` | `Navbar.tsx:23` — `if (!useCartStore.getState().cart) fetchCart()` |
| Client Zustand state as a de facto cache | Cart, wishlist, auth | Stores hold fetched data across route changes (SPA navigation) since Next.js doesn't remount the layout — confirmed by `(storefront)/layout.tsx` wrapping all storefront routes in one `AuthProvider` |
| Next.js `<Image>` component caching/optimization | Product images, homepage images | Used throughout (`ProductCard.tsx`, `page.tsx`) — see Section 7 for depth |

### What's missing

- **No `unstable_cache()` or `React.cache()` anywhere in the codebase.** Grep for these across `src/` returns no matches (verified during Section 2 investigation — repository files call `createClient()` fresh every time). For data that changes rarely per-request but is requested by multiple Server Components in the same tree (e.g., category tree, homepage sections), wrapping repository calls in `unstable_cache()` with a tag would let Next.js dedupe and cache at the data layer, independent of the route-level `revalidate`.
- **No cache tagging (`revalidateTag`) used anywhere** — grep for `revalidateTag`/`revalidatePath` across `src/app/api/admin/` returns no matches. This means: when an admin updates a product, edits a homepage banner, or changes inventory, the storefront's ISR cache is **not explicitly invalidated** — it only refreshes when the 60-second window naturally expires. For inventory/stock-out scenarios this could mean a product shows as in-stock for up to 60s after an admin marks it out of stock. Not catastrophic (60s is short), but worth naming: admin writes to `products`/`homepage_sections`/`inventory` should call `revalidatePath`/`revalidateTag` for the affected storefront routes so changes are visible immediately rather than up to 60s later.
- **No Redis / external cache layer** — not needed at current scale (4 products, 8 variants per `systemstatus.md`), and the audit prompt's own framing ("Redis if needed") suggests this is future-scale territory, not a current gap. At 50,000+ products, category/filter-metadata queries (Section 2) would benefit from a Redis or `unstable_cache` layer for `getFilterMetadata`, which recomputes sizes/tags/price-range from a live query every cache miss.
- **No `fetch()`-level caching directives found** because the codebase uses the Supabase JS client (`supabase.from(...)`), not raw `fetch()`, for data access — Next's `fetch` cache extensions (the ones in the audit prompt: "fetch cache", "tag cache") don't apply directly to Supabase-JS calls. The applicable Next.js caching primitive here is `unstable_cache()` wrapping repository functions, not `fetch` options — worth calling out since the audit brief asks about "fetch cache" specifically and the honest answer is "not applicable to this client library as used."

### Recommended cache placement (where each cache type applies here specifically)

| Cache type | Where it should be used in this codebase |
|---|---|
| ISR (`revalidate`) | Already correctly used on the 3 public catalog pages — keep as is |
| `unstable_cache()` + `revalidateTag` | Wrap `ProductRepository.findAll`/`getFilterMetadata`, `CategoryRepository.findWithChildren`, `HomepageRepository.findByType` — tag by `'products'`, `'categories'`, `'homepage'`; call `revalidateTag(...)` from the corresponding admin write routes (`api/admin/products/*`, `api/admin/content/sections`) so edits show up immediately instead of waiting up to 60s |
| Browser/HTTP cache | Product images already benefit from Next `<Image>` + Cloudinary CDN caching (see Section 7) — no action needed |
| Session/local state cache | Already correctly implemented via Zustand for cart/wishlist/auth — no action needed |
| Redis | Not justified at current scale; revisit if `getFilterMetadata` or category-tree queries become measurably slow past ~10k+ products |

---

## Section 4 — Database Design

Reviewed all 29 migration files (`src/lib/db/migrations/000`–`029`). This is the strongest area of the codebase.

### What's Good

- **Every foreign key column has a supporting index.** Verified directly: `idx_inventory_variant_id`, `idx_cart_items_cart_id` + `idx_cart_items_variant_id`, `idx_order_items_order_id` + `idx_order_items_variant_id`, `idx_orders_user_id`, `idx_wishlist_items_wishlist_id` + `idx_wishlist_items_product_id`, `idx_coupon_usage_coupon_id` + `idx_coupon_usage_user_id`, `idx_product_variants_product_id`, `idx_product_images_product_id` + `idx_product_images_variant_id`, `idx_products_category_id` — this list is exhaustive across the migrations reviewed, no missing FK index found.
- **Partial indexes used correctly for boolean flag columns**: `idx_products_is_featured`, `idx_products_is_best_seller`, `idx_products_is_new_arrival` are all `WHERE is_featured = TRUE AND deleted_at IS NULL` etc. (`003_create_products.sql:26-28`) — this is the right technique for low-cardinality boolean filters on a large future table, keeps the index small.
- **A composite listing index exists specifically for the app's actual query shape**: `idx_products_listing ON products(category_id, status, is_featured, is_best_seller, is_new_arrival) WHERE deleted_at IS NULL` (`020_create_search_indexes.sql:9-12`) — this maps directly to the filters used in `ProductRepository.findAll`, a sign the index was designed against real query patterns, not generically.
- **Full-text search done properly**: `search_vector TSVECTOR` column + `GIN` index + a trigger (`trg_products_search_vector`) that keeps it updated on insert/update (`003_create_products.sql:17,31,44-48`) — correct Postgres FTS pattern, avoids `ILIKE` table scans.
- **Trigram (`pg_trgm`) indexes for fuzzy name matching** (`020_create_search_indexes.sql:1-7`) — appropriate for autocomplete-style partial matches that FTS alone doesn't handle well.
- **Historical-accuracy snapshot pattern on `order_items`** (`016_create_order_items.sql:8-12`): `product_name_snapshot`, `sku_snapshot`, `variant_snapshot`, `image_snapshot` are denormalized onto the order line item at creation time. This is correct e-commerce design — it means a later product rename/deletion doesn't corrupt historical order records, and order history pages don't need to join back to `products` at all (confirmed: `OrderRepository.findByUserId` selects `product_name_snapshot`/`image_snapshot` directly, no join).
- **Sensible ON DELETE semantics per relationship**: `cart_items`/`order_items`/`wishlist_items` `CASCADE` on their parent (correct — a deleted cart should drop its items), `orders.user_id`/`orders.address_id` use `RESTRICT` (correct — prevents deleting a user or address that has order history, preserving referential integrity for financial records), `product_images.variant_id` uses `SET NULL` (correct — deleting a variant shouldn't delete the image, just detach it).
- **1:1 relationships enforced at the DB level, not just app level**: `inventory.variant_id` is `UNIQUE` (`007_create_inventory.sql:3`), `wishlists.user_id` is `UNIQUE` (`013_create_wishlists.sql:3`) — correct use of a unique constraint rather than trusting application code to maintain the invariant.
- **Guest/user cart XOR enforced with a CHECK constraint**, not just app logic: `011_create_carts.sql:11-14` — `CHECK ((user_id IS NOT NULL AND session_id IS NULL) OR (user_id IS NULL AND session_id IS NOT NULL))`, backed by two partial unique indexes (`idx_carts_user_id`, `idx_carts_session_id`, both `WHERE ... IS NOT NULL`). This is a well-designed constraint — it's enforced by Postgres itself, not just trusted application code.
- **Stock invariants enforced via CHECK constraints** (`chk_stock_available >= 0`, `chk_stock_reserved >= 0`, `007_create_inventory.sql:9-10`) and stock mutations go through `SECURITY DEFINER` RPC functions (`decrement_stock`, `reserve_stock`, `release_stock` in `021_create_rpc_functions.sql`) that re-check the invariant atomically inside the same `UPDATE` (`WHERE stock_available >= p_quantity`) rather than a separate read-then-write from application code — this specific piece correctly avoids a race condition, even though the *sequence* of calls around it (Section 2) is inefficient.

### What's Bad / Should Be Redesigned

- **`roles`, `permissions`, `user_roles` tables are now dead schema.** Migration `019_create_roles.sql` built a full RBAC foundation, and migration `024_seed_admin_role.sql` (referenced in `systemstatus.md`'s migration list but not re-read in this pass) seeded an admin role — but Phase 5.1 (per `handover.md` and `AGENTS.md`) replaced admin auth entirely with a stateless HMAC-signed cookie that does **zero** database lookups. `AGENTS.md` explicitly states "NEVER add back a user_roles or sessions lookup to admin middleware." That means these three tables, their indexes, and the granted permissions in `022_phase2_permissions.sql:30-32,48` are now unused surface area — schema that exists, is writable by the `anon` role, but nothing in the current application code path reads or writes it for its intended purpose. Not a performance problem, but a maintenance/security-surface one (see Section 15).
- **RLS is disabled on every single table** (`022_phase2_permissions.sql:8-32`) and the `anon` role has been granted blanket `SELECT, INSERT, UPDATE, DELETE` on all transactional tables (cart, orders, wishlist, coupons, users, addresses — `022_phase2_permissions.sql:45-49`). This is explicitly called out in the migration's own comments as a Phase 2 stopgap ("Phase 3 will replace this with proper per-user RLS policies") and is tracked as Phase 3B in `handover.md`. Flagging here because it's a database-design-level decision with real consequences — covered in depth in Section 15 (Security).
- **`orders.coupon_id` has no explicit index**, unlike every other FK reviewed — `015_create_orders.sql` doesn't create one, and `017_create_coupons.sql` (not re-read in this pass, per `systemstatus.md`'s note that it "ALTER TABLE orders adds FK" retroactively) is the likely place the FK itself was added. Low impact today (coupon usage is a minority of orders and the table will stay small relative to `orders`), but worth adding `CREATE INDEX idx_orders_coupon_id ON orders(coupon_id)` for consistency once coupon usage grows.
- **No index on `homepage_sections.is_active` alone** — only the composite `(section_type, is_active, sort_order)` exists (`029_homepage_sections.sql:21`), which is fine for the current query pattern (`.eq('section_type', ...).eq('is_active', ...)`) but would not help a hypothetical "all active sections across types" query. Not an issue with current code (no such query exists), noting only for completeness.
- **No database-level order-total consistency check** beyond `total >= 0` and `discount >= 0` (`015_create_orders.sql:14-15`) — there's no `CHECK (total = subtotal - discount)` constraint, so a bug in `OrderService.create()`'s arithmetic (`orderService.ts:55`) could silently write an inconsistent total. Low risk given the calculation is simple and centralized in one service method, but it's a gap between what the DB enforces and what the app assumes.

### Verdict

Indexing, FK design, cascade semantics, and the snapshot/immutability pattern for orders are all done at a level well above what's typical for a project at this stage — this is the best-designed layer of the whole system. The two real issues are schema-level leftovers from superseded auth (roles/permissions/user_roles) and the RLS gap that's already tracked as Phase 3B.

---

## Section 9 — State Management (Zustand)

Three stores reviewed in full: `useCartStore.ts`, `useWishStore.ts`, `useAuthStore.ts`. `useCartStore` and `useWishStore` are used via plain destructuring (`const { fetchCart, getItemCount } = useCartStore()`) in most call sites (e.g. `Navbar.tsx:16`, `ProductCard.tsx:29`), not via selectors.

### Findings

- **No selector/shallow-compare usage anywhere.** All three stores are consumed with bare `useStore()` calls that subscribe to the *entire* store object, e.g. `Navbar.tsx:16-18`: `const { fetchCart, getItemCount } = useCartStore(); const cartCount = useCartStore((s) => s.getItemCount());` — note this actually calls `useCartStore` twice, once without a selector (subscribes to everything) and once with one. Any `set()` in `useCartStore` (cart loading, error, or cart data change) re-renders `Navbar` even for fields it doesn't read. At current scale (3 fields in cart store) the cost is negligible; at higher interaction frequency this pattern would cause avoidable re-renders across every subscribed component.
- **Computed values are plain functions, not derived/memoized state.** `getItemCount()` (`useCartStore.ts:86-88`) and `getSubtotal()` (`:90-92`) recompute via `.reduce()` on every call rather than being selectors computed once per state change. Because they're called as `store.getItemCount()` (a snapshot method), calling them in render (as `Navbar.tsx:18` does) does not automatically subscribe to changes — this actually works today only because the same component also subscribes to the store as a whole on line 16, forcing a re-render on any state change, after which `getItemCount()` is recalculated. This is fragile: a component that only calls `getItemCount()` without also subscribing to the store would show stale counts.
- **`useWishStore.toggleItem` implements real optimistic update + rollback** (`useWishStore.ts:41-75`) — this is correctly done: local state flips immediately, server call confirms, and failure rolls back to prior state. Genuinely good pattern, worth preserving as-is.
- **No persistence middleware used** (`zustand/middleware`'s `persist` is not imported anywhere) — cart/wishlist/auth state is rebuilt via API calls on every hard reload (`AuthProvider.tsx` calls `hydrate()` on mount, `Navbar.tsx` calls `fetchCart()` on mount if store is empty). This is a legitimate design choice for wishlist/cart (server is the source of truth, and a guest session ID already exists per `guestSession.ts`), not a bug — flagging only because the audit prompt asked about "unnecessary persistence" and there is none, which is correct here, not a finding against the code.
- **No large/monolithic store.** Each store is small and single-purpose (cart, wishlist, auth) — good separation, not a combined "app store" anti-pattern.
- **Cross-store coupling via `getState()`.** `useWishStore.ts:34` calls `useAuthStore.getState()` directly inside `toggleItem` rather than taking auth state as a parameter — acceptable Zustand pattern (avoids a React dependency), not a performance issue, but worth noting as an architectural coupling between two otherwise-independent stores.

### Verdict

No duplicate state or expensive selectors found. The main real risk is the lack of selector usage — fine at current product/traffic scale, but will cause avoidable re-renders as more components subscribe to `useCartStore`/`useWishStore` (e.g. once wishlist count badge is added to `Navbar`, per Phase 3B in `handover.md`). Recommend adopting `useShallow` or per-field selectors when Phase 3B wires up more subscribers, not urgent today.

---

## Section 5 — Next.js Performance Audit

- **Server Components + ISR are correctly used for the three highest-traffic public pages** (home, shop/[category], product/[slug]) — already covered in Section 1. This is the single biggest Next.js-level win in the codebase and it's real, confirmed by direct file reads.
- **No `middleware.ts` exists anywhere in the project** (`Glob` for `src/middleware.ts` returns no match). Admin route protection (`src/app/admin/layout.tsx`) is done entirely client-side: it's a `'use client'` layout that calls `fetch('/api/admin/stats')` in a `useEffect` to check whether the visitor is an authenticated admin, showing a spinner until that resolves (`admin/layout.tsx:19-39,46-55`). Practical consequences:
  - Every `/admin/*` page load pays one extra client-side round trip (fetch `/api/admin/stats` just to verify identity) before rendering anything but a spinner — this could be eliminated by checking the `admin_token` cookie in Edge Middleware and redirecting server-side before any HTML ships.
  - Reusing a data endpoint (`/api/admin/stats`) as an auth-check probe is fragile — it works today because `requireAdmin()` wraps it, but it conflates "give me dashboard numbers" with "am I logged in." A dedicated lightweight check (or Middleware) would be more robust.
  - This is not a data-exposure bug — every admin API route is independently wrapped in `requireAdmin()` (`adminMiddleware.ts`), so no data actually leaks — but it is a missed opportunity for both performance (Middleware runs at the edge, before rendering) and defense-in-depth (see Section 15).
- **No `next/dynamic` usage anywhere in the codebase** — grep across `src/` returns zero matches. Nothing is lazily code-split within a page. Concretely: `ProductDetailClient.tsx`'s size-chart modal (`sizeChartOpen`, lines 374-405) and `Navbar.tsx`'s `MobileDrawer` (always imported eagerly, `Navbar.tsx:8`) are both conditionally-rendered UI that only a fraction of visitors ever open, yet their code ships in the initial bundle for every visitor. `admin/products/[id]/edit` and `admin/products/new` both import the same large `ProductForm.tsx` — not dynamically split, though this matters less since admin routes are already a separate route chunk from the storefront.
- **Metadata is minimal.** `src/app/layout.tsx:18-21` defines a single static `title`/`description` at the root — no per-page `generateMetadata()` was found on `product/[slug]/page.tsx`, `shop/[category]/page.tsx`, or the home page during this pass. Every product and category page currently ships the same title/description to search engines and social previews, which directly hurts SEO for a catalog site (this overlaps with Section 13's Core Web Vitals framing but is really a metadata-completeness gap, not a speed one — flagging here since the audit brief's Section 5 explicitly asks about "Metadata generation").
- **No Suspense boundaries used for streaming.** No `<Suspense>` found wrapping any async data-dependent subtree in the Server Components reviewed (home, shop, product pages fetch everything in one `Promise.all` at the top of the function before returning JSX — `page.tsx:33-39`, `shop/[category]/page.tsx:31-34`). This means the whole page waits for every parallelized query to finish before any HTML streams, rather than letting fast content (e.g. category header) paint immediately while slower sections (e.g. featured products) stream in behind a skeleton. At current query counts (Section 2) this is a few hundred ms at most, but it's a real lever for the "instant" feel the audit brief asks for once traffic/data volume grows.
- **Partial Prerendering (PPR) is not enabled.** No `experimental.ppr` flag found in `next.config.ts`. Given Next 16 is in use, PPR could let the static shell (nav, category header, layout) prerender fully while the dynamic product grid streams — not currently used.
- **`next.config.ts` is minimal** — only `images.remotePatterns` is configured (`next.config.ts:4-26`). No custom `headers()` for cache-control tuning, no `experimental` block, no bundle analyzer wiring. Not wrong, just unexplored surface area.

## Section 6 — React Performance

- **No `memo`, `useMemo`, or `useCallback` found in any storefront component that renders in a list or on every keystroke/scroll.** Grep confirms `useMemo`/`useCallback`/`memo(` appear only in `ProductGridClient.tsx` (one `useCallback` for `buildUrl`, `:48`) and admin-only files. Concretely:
  - `ProductCard.tsx` (rendered up to 40× per shop page, per `ShopCategoryPage`'s `limit: 40`) is not wrapped in `React.memo` — every re-render of the parent grid (e.g. `ProductGridClient`'s `isPending` state change during a filter transition) re-renders every visible `ProductCard`, even ones whose props didn't change.
  - `ProductDetailClient.tsx:52-54` calls `product.images.sort((a, b) => a.sort_order - b.sort_order)` **directly in the render body, on every render**, and — more importantly — `Array.prototype.sort` **mutates in place**. Since `product.images` is the same array reference passed down from the server-fetched prop, this is a render-impurity: the component is mutating its own props during render. It happens to be idempotent here (sorting an already-sorted array is a no-op), so it's not causing a visible bug today, but it's the kind of pattern that breaks unpredictably (e.g. under React's Strict Mode double-invocation, or if this component is ever reused with unsorted data from a different source). Should be `[...product.images].sort(...)` wrapped in `useMemo`.
  - `ProductDetailClient.tsx:46` recomputes `product.variants.find(...)` on every render — trivial at typical variant counts (a handful of sizes/colors) so not a real cost today, but combined with the sort above, this component has two "expensive calculation in render body" patterns the audit brief specifically asked to look for.
- **No virtualization anywhere** (`react-window`/`react-virtualized` not in `package.json`, and no manual windowing found). The largest list observed is 40 products (`shop/[category]/page.tsx:22`, `limit: 40`) and 30 in admin lists (`systemstatus.md` confirms `Admin products limit 30`) — at these sizes virtualization is unnecessary overhead, not a gap. This would become relevant only if list sizes grow substantially (e.g. an unbounded "load more" pattern at 50k products) — noting for the scalability section, not flagging as a current defect.
- **`ProductCard.tsx` runs a `setInterval` image-cycling carousel on hover** (`ProductCard.tsx:38-48`) — correctly cleans up via the `useEffect` return function, and correctly gated to only run `if (isHovered && ... length > 1)`. This is well-implemented; flagging only to note it was checked, not to raise an issue.
- **The `mounted` gate pattern (`useState` + `useEffect` just to delay first real render) appears in three places**: `ProductCard.tsx:31-32`, `about/page.tsx:10-18`, and implicitly via `isMounted` in `Navbar.tsx:14,21`. This is a legitimate SSR/hydration-mismatch workaround (avoiding a flash where server-rendered "not wished/not authenticated" state briefly shows before client state hydrates), but three independent implementations of the same workaround suggest it could be a single shared hook (e.g. `useHasMounted()`) — a reuse/simplification finding, not a performance one.

## Section 7 — Image Performance

- **`next.config.ts` does not set `images.formats`.** Next's default is `['image/webp']` — AVIF is *not* served for any image that goes through Next's own optimizer, because `formats` was never set to include `'image/avif'`. This directly answers the audit brief's explicit "AVIF" ask: **AVIF is not enabled.**
- **However, product images bypass Next's optimizer for the images that matter most.** `src/lib/utils/imageUrl.ts` implements Cloudinary URL transforms (`getCardImageUrl`, `getThumbImageUrl`, `getDetailImageUrl`) that append `f_auto,q_auto` to the Cloudinary URL — `f_auto` means Cloudinary itself negotiates AVIF/WebP/JPEG based on the requesting browser's `Accept` header, server-side, at the CDN edge. This is arguably *better* than Next's own optimizer for these images (Cloudinary's `f_auto` does real content-aware format selection). The `next.config.ts` AVIF gap therefore mainly affects: the Unsplash-hosted images (`about/page.tsx:100` uses a raw `images.unsplash.com` URL, no Cloudinary transform) and any image that isn't run through `imageUrl.ts`'s helpers. Net: **not a broad problem, but a real one for the small number of non-Cloudinary images** (About page hero, wishlist page's `product.image` at `wishlist/page.tsx:118` which uses the raw `product.image` field, not `getCardImageUrl`).
- **Inconsistent use of the Cloudinary transform helpers.** `ProductCard.tsx:77,90` correctly uses `getCardImageUrl()`. `wishlist/page.tsx:118` renders `product.image` directly with no transform applied — meaning wishlist thumbnails likely download a full-resolution Cloudinary original rather than the `w_800,h_1000` card-sized variant used everywhere else. This is a concrete, fixable overfetch on a page users are likely to revisit often.
- **`sizes` attributes are present and reasonable everywhere `fill` is used** — `ProductCard.tsx:80,93`, `ProductGridClient` (inherited), `ProductDetailClient.tsx:132,182,200` all specify responsive `sizes` strings matching actual layout breakpoints (`50vw`/`33vw`/`25vw` for grid cards, `100vw` for mobile gallery, `76px` for thumbnails). This is correctly done — not a finding, confirming good practice.
- **`priority` is used correctly but narrowly.** Home page passes `priority={i < 2}` to the first two Best Sellers cards (`page.tsx:70`) and `priority={i < 2}` to promo blocks (`page.tsx:89`) — appropriate LCP-candidate prioritization. `ProductDetailClient.tsx:201` correctly sets `priority` unconditionally on the main product image (the actual LCP element on that page). No over-prioritization (every image marked priority, which would defeat the purpose) was found.
- **One raw `<img>` tag exists**, explicitly opted out of Next's Image pipeline: the size-chart image in `ProductDetailClient.tsx:397` (`{/* eslint-disable-next-line @next/next/no-img-element */}`). This is a deliberate, lint-suppressed exception — acceptable for a rarely-viewed modal image, not a broad pattern.
- **No blur placeholders (`placeholder="blur"`) found anywhere.** None of the `<Image>` usages reviewed set a `blurDataURL` or `placeholder="blur"` — every product image pops in abruptly once loaded rather than transitioning from a low-res placeholder. This is a real, cheap win for perceived performance (the audit brief's "zero loading feeling" goal) — Cloudinary can generate blur placeholders via its own transform API (`e_blur`), or Next's `placeholder="blur"` with a tiny inline data URL.
- **No hover/adjacent-image or gallery preloading found.** `ProductCard`'s hover carousel (Section 6) cycles through already-rendered `<Image>` elements (all images for a product are rendered simultaneously with opacity toggling — `ProductCard.tsx:73-87` — not lazy-swapped), so there's no preload gap there specifically. But there is no `<link rel="prefetch">` or Next `Image` priority-boost for the *next* product image when a user is browsing the gallery on the product detail page (`ProductDetailClient.tsx`) — clicking a thumbnail or swiping loads that specific image on demand rather than having adjacent images pre-warmed.
- **Category images (`CategoryCircles.tsx`) not reviewed in this pass** — flagging as "Not enough evidence" for that specific component rather than guessing.

## Section 8 — Network Performance

- **Repeated/duplicate auth checks confirmed as a real, measurable pattern.** `AuthService.validateSession()` (`authService.ts:74-90`) does **two sequential Supabase round trips** on every call — a `sessions` table lookup, then (if valid) a separate `UserRepository.findById()` call. This runs on every hit to `GET /api/auth/me` (`api/auth/me/route.ts:14`), which `useAuthStore.hydrate()` calls on mount of `AuthProvider` (`AuthProvider.tsx:9-11`) — meaning **every storefront page load pays 2 sequential DB round trips just to answer "is anyone logged in?"**, even for anonymous visitors browsing the catalog. This is the audit brief's "repeated auth checks" concern, directly confirmed in code, not assumed.
- **No caching/memoization on the session check.** Since `hydrate()` runs once per client-side app mount (not once per navigation — SPA routing within `(storefront)` doesn't remount `AuthProvider`), this isn't a per-page-navigation cost, but it is a cost paid on every fresh page load / hard refresh, for every visitor, logged in or not.
- **CORS/compression/headers**: no custom `headers()` config in `next.config.ts` — relying entirely on Netlify/Next defaults. Not enough evidence to say whether compression (gzip/brotli) is misconfigured, since that's typically handled transparently by the hosting platform (Netlify) rather than application code — flagging as **"Not enough evidence"** per the audit's own instruction rather than guessing.
- **No request waterfalls found in the three main Server Component pages** — all confirmed to use `Promise.all` for their parallel data needs (`page.tsx:33-39`, `shop/[category]/page.tsx:31-34`). The one real sequential-network-cost pattern is the order-creation N+1 already covered in depth in Section 2 — not repeating the full analysis here, but it is as much a network-performance finding as a Supabase one.
- **Admin dashboard issues 7 parallel round trips per load** (`adminStatsService.ts:20-28`, covered in Section 2) — parallelized correctly, but 7 separate HTTP requests to Supabase's PostgREST endpoint where a single custom RPC function returning one JSON object would be 1 round trip. Given this is an internal admin-only page loaded relatively infrequently, this is a minor/Priority-4 item, not urgent.
- **JSON payload size**: explicit column selects (Section 2) keep most list payloads reasonably lean; the main exception is `DETAIL_SELECT_INNER/LEFT` in `productRepository.ts:28-48` using `*` on the `products` row for the single-product-detail fetch, which includes SEO fields (`meta_title`, `meta_description`, `canonical_url`, `og_image`, `search_vector`) that `ProductDetailClient.tsx` doesn't render — the `search_vector` (a `TSVECTOR`) in particular is dead weight on every product-detail page load and should be excluded from the select list.

## Section 12 — Bundle Analysis

**No bundle analyzer output exists in this repo, and none was generated as part of this audit (would require running a build) — the estimates below are derived from `package.json`'s dependency list and observed import patterns, not measured bundle sizes. Flagging clearly per the audit's "no assumptions" instruction: this section is directionally reliable, not a substitute for running `next build` with `@next/bundle-analyzer`.**

- **Dependency list (`package.json:11-33`) is lean overall** — no obviously bloated or duplicate-purpose libraries. Notable weights: `framer-motion` (^12.38.0, typically the single largest client dependency in a project like this, often 40-60kb gzipped depending on what's tree-shaken), `react-hook-form` + `@hookform/resolvers` (admin forms only), `zod` (already required for validation, shared client+server), `sharp` (server-only, image processing — correctly a dependency, not devDependency, since it likely runs in Cloudinary/upload server routes).
- **`framer-motion` is imported broadly across storefront components** — `ProductCard.tsx`, `ProductGridClient.tsx`, `HeroBanner.tsx`, `about/page.tsx`, `Testimonials.tsx`, `wishlist/page.tsx` (per the earlier `'use client'` grep) all import from `framer-motion`. Since none of these are behind `next/dynamic` (Section 5), `framer-motion` is part of the eagerly-loaded storefront client bundle rather than split off. Given how pervasively it's used for basic entrance animations (`initial`/`animate` fade-ins), a chunk of this usage could likely be replaced with CSS transitions/animations for the simple cases (fade + slide on mount), reserving `framer-motion` for genuinely complex interactions (the `AnimatePresence` grid reflow in `ProductGridClient.tsx:294-309` is a good example of where the library actually earns its cost).
- **No dynamic imports means no route-internal code splitting** — already covered in Section 5, repeating here because it's directly a bundle-size lever: the product detail page's size-chart modal and its `<img>` size-chart viewer, and `Navbar`'s `MobileDrawer`, ship in the initial JS for every visitor rather than being split into on-demand chunks.
- **Icon usage (`lucide-react`)**: imports are all named/per-icon (`import { Search, Heart, ... } from 'lucide-react'`) across every file checked — this is the correct tree-shakeable pattern for this library; not a bundle concern.
- **Admin and storefront are naturally separated** by Next's route-based code splitting (`app/admin/` vs `app/(storefront)/` are different route trees), so admin-only dependencies (`react-hook-form`, `@hookform/resolvers`) don't bloat the storefront bundle — this is a structural win from the route-group architecture noted in Section 1, not something that needed explicit configuration.
- **Recommendation**: run `next build` with bundle analysis enabled (`ANALYZE=true` if wired up, or `@next/bundle-analyzer`) to get real numbers before prioritizing further bundle work — this audit can identify *where* dynamic imports would help (size-chart modal, mobile drawer) but can't respons­ibly state current KB figures without measuring.

## Section 15 — Security

### 🔴 Critical

- **Phone-only login has no possession proof (no OTP) — this is an authentication bypass, not just a missing nice-to-have.** `AuthService.authenticateByPhone()` (`authService.ts:23-35`) calls `UserRepository.createOrUpdateByPhone(phone)` and immediately issues a session — there is no code path that verifies the caller actually controls that phone number. `loginSchema` (`authSchema.ts:3-8`) validates only that the input is a 10-digit string. **Anyone who knows or guesses another person's 10-digit phone number can log in as them** — see their order history, saved addresses, and wishlist. `walkthrough.md`/`CLAUDE.md` both list "OTP Verification" as Phase 3.1, "Planned" — this audit's contribution is confirming the severity precisely: this isn't a hardening gap on top of a working auth system, the current phone-login flow **is** the account-takeover vector, live in production per `systemstatus.md`'s "Database: LIVE ✅" status. Should be treated as a Priority 1 item, not deferred as a normal roadmap phase, given real user data (orders, addresses) is reachable through it today.
- **No rate limiting anywhere in the codebase.** Grep for `rate.?limit`/`ratelimit` (case-insensitive) across all of `src/` returns zero matches. This compounds the phone-login issue directly (nothing stops scripted enumeration of phone numbers against `/api/auth/login`) and also leaves `/api/admin/auth/login` open to unlimited password-guessing attempts against `ADMIN_PASSWORD`.

### 🟠 High

- **Admin password comparison is not constant-time.** `api/admin/auth/login/route.ts:32` does `password === adminPassword` — a plain string comparison, which is vulnerable in theory to a timing side-channel (early-exit comparison leaks information about how many leading characters matched). In practice, exploiting this over a network with realistic jitter is hard but not impossible, and the fix (`crypto.timingSafeEqual`) is a one-line change — worth doing given this guards the entire admin platform.
- **RLS is disabled on every table, and `anon` has blanket write access to sensitive tables**, confirmed directly in `022_phase2_permissions.sql:20-32,45-49`: `users`, `addresses`, `orders`, `order_items`, `coupons`, `coupon_usage` all grant `SELECT, INSERT, UPDATE, DELETE` to the `anon` role. Since the Supabase anon key is, by design, exposed to the browser (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), **any visitor with browser dev tools open can call the Supabase REST API directly**, bypassing the Next.js API routes and their Zod validation/service-layer business rules entirely, and read or write any row in these tables (e.g. read any user's orders/addresses by ID, or write directly to `orders`/`coupon_usage` without going through `OrderService`'s stock/coupon validation). This is already tracked as Phase 3B in `handover.md` ("Per-user RLS policies... Migration 022 disabled for simplicity") — this audit confirms the exact tables and grants involved and that the risk is real given the anon key is necessarily public.
- **`orderService.ts`'s business rules (stock checks, coupon validation) are enforceable only through the Next.js API layer** — because of the RLS gap above, none of that validation is a hard guarantee; it's bypassable by calling Supabase directly with the anon key.

### 🟡 Medium

- **Unsanitized HTML rendered via `dangerouslySetInnerHTML`.** `ProductDetailClient.tsx:364-367` renders `product.description` as raw HTML with no sanitization step visible in this render path. If the admin product-description field accepts HTML (the CSS selectors targeting `ul`/`ol`/`strong`/`em`/`h1`/`h2`/`p` at `:365` strongly suggest it does), this is a stored-XSS surface: **any admin account compromise (including the weak-password/no-rate-limit issue above) becomes a stored XSS against every storefront visitor**, not just an admin-panel-only risk. Whether the admin product form itself sanitizes input on save was not traced in this pass — flagging as "not enough evidence" for *where* sanitization should happen, but confirmed that the render path has none.
- **`roles`/`permissions`/`user_roles` tables are dead but still writable by `anon`** (Section 4) — not currently exploitable for privilege escalation since nothing reads them for authorization decisions anymore (`AGENTS.md` confirms admin auth never touches them), but they're unnecessary attack surface that should be either removed or have RLS re-enabled alongside the Phase 3B RLS work.
- **Session tokens are correctly implemented**: `authService.ts:49` generates a 32-byte cryptographically random token (`randomBytes(32).toString('hex')`), and the login route sets it as `HttpOnly; Secure; SameSite=Strict` (`api/auth/login/route.ts:41`). The admin HMAC token (`admin/auth/login/route.ts:38-43`) is similarly `HttpOnly; Secure; SameSite=Strict`. **Both cookie configurations are correct** — flagging as confirmed-good, not a finding.
- **Admin HMAC token has no revocation mechanism** — by design (`AGENTS.md`: stateless, no DB lookup), an issued `admin_token` remains valid for its full 7-day TTL even if `ADMIN_PASSWORD` is rotated immediately after — actually, on closer reading, rotating `ADMIN_PASSWORD` *would* invalidate existing tokens, since `verifyAdminToken` (`adminMiddleware.ts:7-19`) HMACs the payload using the *current* `adminPassword` env var and compares signatures — so a password rotation does implicitly revoke all outstanding tokens. This is actually a reasonable emergency-revocation path (rotate the password) — noting as a partial mitigation, not a gap.

### 🟢 What's Good

- Layered access to `SUPABASE_SERVICE_ROLE_KEY` is respected — confirmed in Section 1/CLAUDE.md compliance check, it appears only in `src/lib/db/admin.ts` in this codebase.
- Zod validation is used consistently at the API boundary (`loginSchema`, `checkoutSchema`, etc.) — this stops malformed input from reaching services, even though it doesn't stop direct-Supabase-call bypass (the RLS issue above).
- Cookie security attributes (`HttpOnly`, `Secure`, `SameSite=Strict`) are correctly set on both the customer session and admin token cookies.
- Stock-mutation RPC functions use `SECURITY DEFINER` with an atomic `WHERE stock_available >= p_quantity` check (Section 4) — this specific piece is race-condition-safe even though it's called inefficiently (Section 2).

---

## Section 10 — Shopping Experience

This section synthesizes findings from Sections 1–9 against each step of the funnel, plus new evidence from `checkout/page.tsx`.

- **Homepage**: Server-rendered, ISR-cached (Section 5), correctly parallelized data fetch (Section 2). Good foundation. Gap: no `<Suspense>` streaming (Section 5) — the whole page waits on the slowest of 5 parallel queries before any HTML ships.
- **Category/shop page**: Server-rendered + ISR, but filter interactions (`ProductGridClient`) trigger a full `router.push()` + server round trip per filter click (`ProductGridClient.tsx:57-59`), wrapped in `useTransition` for a non-blocking pending state (`isPending`, correctly used to dim the grid during the transition — `:283`). This is a reasonable pattern for SEO-friendly filter URLs, but each filter click re-runs the full category page's server-side data fetch (main listing + up to 5 metadata queries per Section 2) rather than doing a lighter client-side re-filter for parameters that don't affect the category-navigation/metadata (price, size, tag, sort don't change `subcategories`/`parent_category`, yet `getFilterMetadata` recomputes them every time).
- **Product page**: Well-built interaction model (variant selection, quantity, gallery) — reviewed in full in Section 6. Real gaps: no `useMemo` on sort/find calls (minor at current scale), no image preloading for adjacent gallery images (Section 7), no blur placeholders (Section 7).
- **Cart**: `useCartStore` correctly implements optimistic-feeling updates by re-fetching the whole cart after each mutation (not truly optimistic — see Wishlist below for the contrast) — every `addItem`/`updateItem`/`removeItem` call awaits the server response before updating UI (`useCartStore.ts:38-48` etc.), so cart interactions wait for a full round trip rather than updating instantly and reconciling after. This is a real, fixable gap against the "zero loading feeling" goal, and it's inconsistent with the wishlist store's approach (see below).
- **Wishlist store**: Correctly optimistic (Section 9) — flips UI state immediately, rolls back on failure. This is the right pattern; the cart store should arguably match it (optimistically update item counts/subtotal client-side, reconcile with server response, roll back on error) rather than waiting for the round trip on every click.
- **Checkout**: `checkout/page.tsx` is a `'use client'` page that calls **both** `fetchCart()` (`:24`) and `hydrate()` (`:25`) unconditionally in `useEffect` on every mount — **this directly matches the audit brief's "duplicate cart requests" and "repeated auth checks" concerns**, and is worse than the Navbar's already-fixed pattern: `Navbar.tsx:23` guards its cart fetch with `if (!useCartStore.getState().cart)`, but `checkout/page.tsx:24` has no such guard, so navigating from cart → checkout re-fetches cart data that's almost certainly already fresh in the store, and re-runs the 2-round-trip session validation (Section 8) that `AuthProvider` already ran once at layout mount. This is a concrete, easy fix: apply the same "skip if already loaded" guard used in `Navbar.tsx`.
- **Search**: The Navbar search input (`Navbar.tsx:50-54`) is a plain, non-functional `<input>` — no `onChange`, no results dropdown, no link to a search results page found in this component. `ProductRepository.search()` exists server-side (`productRepository.ts:155-158`) and is wired to nothing in the UI that was found in this pass. **Not enough evidence to say search is fully unimplemented across the whole app** (a dedicated search page may exist outside the files sampled), but the Navbar's search bar specifically appears to be a non-functional placeholder.
- **Recommendations/Recently Viewed**: No code implementing either was found anywhere in `src/` (no "recently viewed" store, localStorage key, or DB table in the 29 migrations reviewed). This is a feature gap, not a performance bug — noting because the audit brief explicitly asks about it under this section.

## Section 11 — Mobile Performance

- **Touch-friendly gallery swipe is implemented correctly on the product page**: `ProductDetailClient.tsx:113-137` uses a native horizontally-scrolling flex container with `scroll-snap-type: x mandatory` and `WebkitOverflowScrolling: touch` (`:119`) — this is the right, GPU-cheap approach (native scroll-snap, not a JS-driven swipe gesture library), and the scroll handler (`handleMobileScroll`, `:57-62`) that syncs the dot indicator only reads `scrollLeft`, doesn't do any heavy work per scroll event.
- **`MobileDrawer` uses `framer-motion` spring physics for its slide-in** (`MobileDrawer.tsx:52-56`, `type: 'spring', stiffness: 300, damping: 30`) — animating `x` transform, which is GPU-accelerated (compositor-only, not layout-triggering) — correctly implemented, no jank risk from this specific animation.
- **`CategoryCircles` uses a native horizontal-scroll row** (`CategoryCircles.tsx:74`, `overflow-x-auto`) rather than a JS carousel library — same "let the browser do it" pattern as the product gallery, good for mobile scroll performance and battery.
- **`backdrop-blur` is used pervasively** (`Navbar.tsx:38` `backdrop-blur-[20px] backdrop-saturate-[1.8]`, `MobileDrawer.tsx:45` `backdrop-blur-[4px]`, `PhoneModal.tsx:39` `backdrop-blur-sm`, product-card overlays). `backdrop-filter` is one of the more GPU-expensive CSS properties, especially at `20px` blur radius on a `sticky` full-width nav bar that repaints on every scroll frame (`isScrolled` state toggles a `shadow-s3` class on scroll, `Navbar.tsx:24,37-40` — the blur itself is always-on, not toggled, so it's a constant compositing cost during scroll, not just at the toggle moment). On lower-end Android devices in particular, a persistent 20px backdrop-blur on a sticky header is a known source of scroll jank. **Not enough evidence to state an actual measured FPS drop** (would require on-device profiling this audit didn't perform), but this is the single most likely CSS-level mobile-jank suspect found in the codebase, worth a real-device test.
- **No explicit `touch-action` CSS found** on swipeable/scrollable regions — not necessarily a problem (browser defaults are usually adequate for simple scroll containers), but worth noting as unverified rather than confirmed-fine.
- **CLS risk from carousel/gallery containers**: `ProductCard.tsx`'s hover-cycling images (`:73-87`) all use `fill` inside a `relative aspect-[3/4]` parent (`:72`) — the `aspect-` utility reserves layout space before the image loads, which correctly prevents layout shift. This pattern is used consistently across the codebase everywhere `fill` appears — a real, verified CLS mitigation, not just assumed.
- **Mobile-specific data cost**: the shop category page fetches `limit: 40` products (`shop/[category]/page.tsx:22`) regardless of viewport — mobile visitors on a 2-column grid download the same 40-product JSON payload (and, since none are lazy-excluded, the same image count with `priority` on the first 2 per `ProductGridClient.tsx:305`'s `idx < 4`) as desktop visitors on a 4-5 column grid. Not wrong, but a candidate for a smaller initial page size on mobile given the audit brief's "heavy mobile traffic" framing.

## Section 13 — Core Web Vitals

**No Lighthouse run, WebPageTest, or real-user-monitoring data was available to this audit — every figure below is a structural estimate derived from the code patterns already documented in Sections 5–8, not a measurement. Per the audit's own instruction, this is stated explicitly rather than presented as measured data.**

| Metric | Structural assessment | Basis |
|---|---|---|
| **LCP** | Likely reasonable on the 3 ISR-cached pages (Server Component + `priority` set on the actual LCP image, Section 7) but hurt by no blur placeholder and by AVIF not being enabled for non-Cloudinary images | `page.tsx`, `ProductCard.tsx`, `next.config.ts` |
| **CLS** | Likely good — `aspect-[3/4]` + `fill` used consistently (Section 11), no evidence of layout-shifting web fonts (both fonts use `display: 'swap'`, `layout.tsx:9,15`, which trades a brief FOUT for no CLS — reasonable choice) | `layout.tsx:6-16`, image patterns across components |
| **INP** | At risk from the persistent 20px `backdrop-blur` on the sticky nav during scroll/interaction (Section 11), and from cart mutations blocking on full round trips before UI updates (Section 10) rather than responding instantly | `Navbar.tsx:38`, `useCartStore.ts` |
| **TTFB** | Good on the 3 ISR pages once cached (served from the edge/CDN, no DB hit per `systemstatus.md`'s own claim, consistent with what this audit verified); worse on cache-miss requests given the 5–6 sequential/parallel Supabase round trips documented in Section 2 | `page.tsx`, `shop/[category]/page.tsx`, Section 2 |
| **FCP** | Hurt specifically on `/about`, `/about-us`, `/wishlist`, `/account` — all full client components with no server-rendered content, meaning FCP waits on JS download + hydration rather than server-rendered HTML (Section 1) | `about/page.tsx`, `wishlist/page.tsx`, `account/page.tsx` |
| **Speed Index** | No basis to estimate without a real trace — **not enough evidence** |

**What will hurt Google rankings specifically**: the missing per-page `generateMetadata()` (Section 5) is a more direct SEO problem than any speed metric here — every product and category page currently shares one title/description, which affects search-result click-through and indexing quality independent of Core Web Vitals. The `/about` + `/about-us` duplicate-content pair (Section 1) is a second direct SEO issue, unrelated to performance.

## Section 14 — User Experience / Predictive Loading

- **No hover-prefetch, viewport-prefetch, or speculative prefetch beyond Next's built-in `<Link>` prefetching was found.** Next.js `<Link>` automatically prefetches linked pages when they enter the viewport in production by default — this is used throughout (`ProductCard`, `Navbar`, `Footer`, `ProductGridClient` all use `next/link`'s `Link` component, not raw `<a>` tags, confirmed by grep pattern in the files read) — so baseline route prefetching is already working via Next's default behavior, not extra code. No *additional* prefetch logic (e.g. prefetching a product's data on card hover, ahead of Next's automatic link prefetch) was found layered on top.
- **Loading states are implemented, but inconsistently**: `wishlist/page.tsx:75-79` and `account/page.tsx:19-24` show skeleton placeholders (`animate-pulse` divs) during their client-side fetch. `ProductGridClient.tsx:283` uses an opacity-dim + `pointer-events-none` overlay during `isPending` transitions rather than a skeleton. Neither approach is wrong, but the inconsistency (skeleton vs. dim-overlay vs., on the checkout page, no loading state shown at all around the `fetchCart()`/`hydrate()` calls per Section 10) means the "instant" feel varies by page rather than being a deliberate, unified loading strategy.
- **No optimistic updates on cart mutations** (Section 10) — this is the most direct, fixable gap against the audit brief's explicit "optimistic updates" ask, especially since the wishlist store in the same codebase already demonstrates the correct pattern (Section 9) that could be mirrored into the cart store.
- **No background/idle-time prefetching of likely-next data** (e.g. prefetching cart contents before the user navigates to `/cart`, or prefetching the next page of a paginated list) was found — not a defect, just an unexplored lever for the "predictive loading" goal in the brief.

## Section 16 — Scalability

Assessed against the brief's stated targets: 100k products, 500 concurrent users, 5k daily users, 100k monthly users, 50 orders/minute.

**What would fail first, in order:**

1. **Order creation throughput** — the confirmed N+1 in `OrderService.create()` (Section 2) is the clearest bottleneck against the "50 orders/minute" target. At 4N+2 sequential round trips per order (N = items), 50 orders/minute with ~3 items each means ~150+ sequential Supabase round trips/minute concentrated in this one code path, each one holding open a serverless function invocation (Netlify Functions, per the deployment target in `CLAUDE.md`) for the full sequential chain. This is the single most likely first failure point under the stated load — not a guess, but a direct structural read of the loop-based code.
2. **`getFilterMetadata`'s live recomputation** (Section 2) — at 100k products, the category/shop page's up-to-5-query metadata fan-out (sizes, tags, price range, category nav — all computed live from `products`/`product_variants` on every cache miss) would scan meaningfully larger result sets than today's handful of seed products. The existing indexes (Section 4) would keep individual queries fast, but the *number* of round trips per cache miss (not their individual speed) is the structural risk — this compounds with concurrent users each triggering distinct filter-combination cache keys.
3. **RLS-disabled + blanket anon grants** (Section 15) — this isn't a throughput failure, but at higher traffic and higher attacker interest (a business handling real orders/payments is a more attractive target than a pre-launch project), the direct-Supabase-bypass risk described in Section 15 becomes proportionally more dangerous, not less.
4. **Client-side-only admin auth check** (Section 5) — at higher admin-team size (multiple staff accounts, once that's built), the extra round-trip-per-admin-page-load pattern would compound linearly with admin usage, though this is a minor, not critical, scaling concern.
5. **No pagination/virtualization ceiling found yet** — current list limits (30-40 items) are hardcoded and would need to become genuinely paginated/infinite-scroll at 100k products for the *shop* pages (not just admin), but `ProductGridClient` already receives a finite `initialProducts` array with no "load more" mechanism observed in this pass — **not enough evidence this is fully absent app-wide** (a load-more/pagination component may exist outside the files sampled), flagging as worth verifying directly rather than asserting it's missing.

**What would scale fine as-is:** the read-heavy catalog browsing path (home, shop, product pages) — ISR caching means most of the 100k-monthly-user traffic never touches the database at all once a page is warm, and the indexing work (Section 4) is already designed for exactly this query shape. The database schema itself (normalization, FK design, snapshot pattern) would not need rework at 100k products — it's the *access patterns* (N+1 in checkout, live metadata recomputation) that would need fixing before the schema would.

## Section 17 — Final Scorecard

**Scored out of 10 against this specific codebase's actual state, not a generic e-commerce checklist. Each score is directly traceable to a section above.**

| Category | Score | Why |
|---|---|---|
| Architecture | 7/10 | Route-group isolation and Server/Client split on the 3 main pages are genuinely well done (Section 1); dead code (`ProductDrawer`), duplicate route (`/about-us`), and unnecessarily-client marketing pages hold it back |
| Database | 9/10 | Indexing, FK design, cascade semantics, snapshot pattern are excellent (Section 4); only loses points for dead RBAC schema and the RLS gap (which is really a security score issue counted once, not twice) |
| Supabase Usage | 5/10 | Several genuinely well-optimized patterns exist (nested cart query, parallel admin stats, pushed-down filters — Section 2) but the checkout N+1 is a serious, confirmed structural problem that outweighs them |
| Performance (general) | 6/10 | ISR on the 3 main pages does the heavy lifting; undermined by the checkout N+1, no request memoization, and no Suspense streaming |
| Caching | 6/10 | ISR correctly applied; no `unstable_cache`/`revalidateTag` means admin writes don't invalidate storefront cache immediately, and no data-layer caching exists beyond the route level (Section 3) |
| Images | 6/10 | Cloudinary `f_auto,q_auto` transforms are a smart choice for the majority of images (Section 7); AVIF gap in `next.config.ts`, no blur placeholders, and one un-transformed wishlist image are real, fixable gaps |
| React | 6/10 | No egregious anti-patterns, but zero `memo`/`useMemo` usage on list-rendered components, plus one render-purity issue (mutating `.sort()` in `ProductDetailClient`) |
| Next.js | 7/10 | Correct use of ISR + Server Components on the pages that matter most; missing Middleware, `next/dynamic`, Suspense, and per-page metadata |
| UX | 6/10 | Wishlist's optimistic-update pattern is genuinely good UX engineering; cart's non-optimistic pattern and checkout's duplicate-fetch bug (Section 10) work directly against the "instant" goal in the brief |
| SEO | 5/10 | Duplicate `/about`/`/about-us` content and missing per-page metadata (Section 5/13) are concrete, fixable SEO problems independent of performance |
| Scalability | 5/10 | Catalog browsing would scale well as-is (ISR-cached); checkout throughput is a real, structurally-confirmed risk at the brief's stated order volume (Section 16) |
| Security | 3/10 | The phone-login-as-anyone-else gap and the RLS-disabled-with-blanket-anon-grants combination (Section 15) are the most serious findings in this entire audit — both are live in a production system holding real user data per `systemstatus.md` |
| Maintainability | 7/10 | Consistent layered architecture (route → service → repository) followed almost everywhere, good migration hygiene, clear naming; dinged for the dead `ProductDrawer`/RBAC-table leftovers and the repeated `mounted`-gate pattern that should be a shared hook |

**Overall: 6.0/10** (simple average). The codebase's foundations — database design, the route-group architecture, the ISR strategy on the three pages that carry the most traffic — are genuinely strong and above what's typical at this project stage. The score is pulled down almost entirely by a small number of specific, fixable issues concentrated in two places: **checkout (the order-creation N+1)** and **auth/security (phone-login bypass, RLS gap)** — not by broad, systemic weakness.

## Section 18 — Action Plan

Every item below traces to a specific finding in Sections 1–16. Estimates are conservative and marked "structural estimate" where no measurement was possible, per the audit's own instruction not to invent precision that wasn't verified.

### Priority 1 — Critical (fix before any real launch/marketing push)

| # | Problem | Where | Impact | Difficulty | Estimated improvement |
|---|---|---|---|---|---|
| 1 | Phone-only login has no OTP/possession proof — anyone can log in as any user by phone number | `authService.ts:23-35`, `authSchema.ts` | Account takeover of real customer data (orders, addresses) | Medium (needs an SMS OTP provider integration) | Closes a live account-takeover vector — not a performance number, a security fix |
| 2 | RLS disabled + blanket `anon` CRUD grants on `users`/`orders`/`addresses`/`coupons` | `022_phase2_permissions.sql:20-32,45-49` | Any browser can read/write these tables directly via the public anon key, bypassing all app-layer validation | Medium-High (per-user RLS policies, already scoped as Phase 3B) | Closes direct-database-bypass risk |
| 3 | Sequential N+1 in order creation (4N+2 round trips per order) | `orderService.ts:14-100`, `inventoryService.ts:20-29` | Checkout latency (structural estimate: ~0.7-2.1s of added network wait for a 3-item order) and the first likely bottleneck at the stated 50 orders/minute target | Medium (wrap steps in one `plpgsql` RPC, or at minimum `Promise.all` the independent parts) | Structural estimate: eliminates the vast majority of the 4N+2 round trips; also fixes the already-known missing-transaction data-integrity gap in the same code |
| 4 | No rate limiting anywhere (compounds #1, also exposes admin login to brute force) | Whole `src/app/api/` tree, confirmed via grep | Unlimited login/enumeration attempts against both customer and admin auth | Low-Medium (middleware or a simple in-memory/Upstash limiter on auth routes) | Closes a direct enabler of #1 and admin password brute-forcing |

### Priority 2 — High

| # | Problem | Where | Impact | Difficulty | Estimated improvement |
|---|---|---|---|---|---|
| 5 | Unsanitized `dangerouslySetInnerHTML` for product descriptions | `ProductDetailClient.tsx:364-367` | Stored XSS surface against every storefront visitor if admin content is ever compromised or a contributor pastes unsafe HTML | Low (add a sanitizer like `isomorphic-dompurify` at render or save time) | Closes a stored-XSS path |
| 6 | Cart mutations block on full round trip instead of updating optimistically | `useCartStore.ts:38-84` | Every add/update/remove-from-cart feels slower than it needs to; directly against the brief's "zero loading feeling" goal | Medium (mirror the already-correct pattern in `useWishStore.ts:41-75`) | Structural estimate: perceived add-to-cart latency drops from "one network round trip" to "instant," matching the wishlist interaction today |
| 7 | Checkout re-fetches cart and re-hydrates auth unconditionally, duplicating work already done at layout mount | `checkout/page.tsx:24-25` | Extra ~2+ Supabase round trips (session validation, Section 8) on every checkout page load | Low (apply the same guard `Navbar.tsx:23` already uses) | 1 avoided cart fetch + 2 avoided session-validation round trips per checkout visit |
| 8 | Admin route protection is entirely client-side with no Middleware | `admin/layout.tsx:19-39`, no `middleware.ts` exists | Extra client round trip before any admin page renders; weaker defense-in-depth | Medium (add Edge Middleware checking the `admin_token` cookie) | Removes one client-server round trip from every admin page's time-to-meaningful-paint |
| 9 | No `unstable_cache`/`revalidateTag` — admin writes don't invalidate storefront ISR cache | `src/app/api/admin/*` write routes | Storefront can show stale data (e.g. sold-out product) for up to the 60s ISR window after an admin change | Low-Medium | Removes up to 60s of staleness after any admin content/inventory change |

### Priority 3 — Medium

| # | Problem | Where | Impact | Difficulty | Estimated improvement |
|---|---|---|---|---|---|
| 10 | Home page issues 2 separate `homepage_sections` queries that could merge into 1 | `page.tsx:37-38` | 1 extra Supabase round trip per home page ISR cache miss | Low | 1 fewer round trip per cache miss (structural estimate) |
| 11 | Cart/wishlist "find or create" costs 2 round trips instead of 1 | `cartRepository.ts:14-34`, `wishlistRepository.ts:5-25` | 1 extra round trip on every first-time guest/user cart or wishlist touch | Low (`upsert` with `onConflict`) | 1 fewer round trip per first touch |
| 12 | `wishlist/page.tsx` renders un-transformed Cloudinary images | `wishlist/page.tsx:118` | Larger-than-necessary image downloads on a frequently-revisited page | Low (apply `getCardImageUrl()`, already used elsewhere) | Structural estimate: brings wishlist image payload in line with the already-optimized product-card size |
| 13 | AVIF not enabled in `next.config.ts` | `next.config.ts` | Slightly larger images for the minority of non-Cloudinary-transformed images (About page hero, any future non-Cloudinary image) | Low (`images.formats: ['image/avif','image/webp']`) | Minor — most images already get CDN-level format negotiation via Cloudinary's `f_auto` |
| 14 | No blur placeholders on any product image | `ProductCard.tsx`, `ProductDetailClient.tsx` | Images pop in abruptly rather than transitioning smoothly — perceived-performance gap | Low-Medium (Cloudinary `e_blur` transform or Next `placeholder="blur"`) | Perceived-loading improvement, not measurable in raw KB/ms terms |
| 15 | No `next/dynamic` anywhere — size-chart modal, mobile drawer ship in initial bundle | `ProductDetailClient.tsx:374-405`, `Navbar.tsx:8` | Slightly larger initial JS for every visitor, most of whom never open these | Low | Structural estimate — modest, would need a real bundle analysis (Section 12) to quantify KB saved |
| 16 | No `<Suspense>` streaming on the 3 main Server Component pages | `page.tsx`, `shop/[category]/page.tsx`, `product/[slug]/page.tsx` | Whole page waits for slowest parallel query before any HTML streams | Medium | Structural estimate — larger benefit as query count/data volume grows; modest today given fast current queries |
| 17 | No per-page `generateMetadata()` | `product/[slug]/page.tsx`, `shop/[category]/page.tsx` | Every product/category page shares one title/description — hurts SEO independent of speed | Low-Medium | Direct SEO improvement, not a performance number |
| 18 | Duplicate `/about` and `/about-us` routes serving identical content | `about-us/page.tsx`, `about/page.tsx` | Duplicate-content SEO issue | Low (redirect or delete one) | Direct SEO cleanup |
| 19 | Persistent 20px `backdrop-blur` on sticky nav during scroll | `Navbar.tsx:38` | Suspected mobile scroll jank on lower-end devices — unverified without on-device profiling | Low-Medium (reduce blur radius or disable during active scroll) | Not enough evidence for a number — flagged for real-device testing |

### Priority 4 — Nice to Have

| # | Problem | Where | Impact | Difficulty |
|---|---|---|---|---|
| 20 | `ProductDrawer.tsx` is dead code duplicating `ProductForm.tsx` | `components/admin/ProductDrawer.tsx` | Maintenance risk (could silently drift from the component actually in use) | Low (remove or wire in) |
| 21 | `roles`/`permissions`/`user_roles` tables are dead schema from pre-Phase-5.1 auth | `019_create_roles.sql`, `024_seed_admin_role.sql` | Unnecessary attack surface, maintenance confusion | Low-Medium |
| 22 | Three independent implementations of the same `mounted`-gate hydration workaround | `ProductCard.tsx:31-32`, `about/page.tsx:10-18`, `Navbar.tsx:14,21` | Code duplication, not a performance issue | Low (extract a shared `useHasMounted()` hook) |
| 23 | Admin password compared with `===` instead of constant-time comparison | `api/admin/auth/login/route.ts:32` | Theoretical timing side-channel | Low (`crypto.timingSafeEqual`) |
| 24 | Navbar search input is non-functional (no `onChange`/results) | `Navbar.tsx:50-54` | Feature gap, not a bug — flagged since a working search is core to "instant" shopping UX | Medium |
| 25 | No recently-viewed or recommendations feature | Not found anywhere in `src/` | Feature gap per the audit brief's explicit ask | Medium-High (new feature, out of scope for a performance audit alone) |

---

## Section 1 — Project Architecture Audit

### What's Good

- **Route-group isolation is real and correctly wired.** `src/app/layout.tsx` is a bare HTML/font/Toaster shell with no storefront chrome. `src/app/(storefront)/layout.tsx:6-21` wraps only storefront routes with `AuthProvider` → `Navbar` → `{children}` → `Footer` → `PhoneModal`. `src/app/admin/layout.tsx` is a separate tree entirely. Confirmed no cross-bleed of providers/CSS between the two shells.
- **Server Components correctly own data-fetching for the three highest-traffic pages.** `src/app/(storefront)/page.tsx:32-39`, `src/app/(storefront)/shop/[category]/page.tsx:9-34`, and `src/app/(storefront)/product/[slug]/page.tsx:7-21` are all `async` Server Components that call `ProductService`/`HomepageService` directly and set `export const revalidate = 60`. This is the correct pattern — no client-side fetch waterfall for first paint on these routes.
- **Clean server/client split within data-heavy pages.** The category and product pages fetch on the server and hand pre-rendered data to thin client wrappers (`ProductGridClient.tsx`, `ProductDetailClient.tsx`) that only need `'use client'` for filter interactivity, not for the initial data. This is the right shape for ISR + interactivity to coexist.
- **Layered architecture (`Route → Service → Repository → Supabase`) is followed consistently** in every file sampled (`productService.ts`, `orderService.ts`, `couponService.ts` all delegate to a matching repository; no `.from(` calls found outside `src/lib/repositories/` and `src/lib/db/admin.ts` during this pass — verified in Section 2).
- **Navbar cart-fetch guard** (`src/components/layout/Navbar.tsx:23`) skips refetching cart if the Zustand store already has data — a real, verified optimization (matches the claim in `systemstatus.md`).

### What's Bad

- **`src/app/(storefront)/about-us/page.tsx` is dead weight.** Its entire content is:
  ```
  'use client';
  import AboutPage from '../about/page';
  export default AboutPage;
  ```
  This creates a second route (`/about-us`) that just re-exports `/about`'s client component. The `'use client'` directive here is redundant (the imported module already declares it), and having two URLs serve identical content is a routing/SEO smell (duplicate content, no canonical redirect) rather than a performance one — flagging under architecture, not claiming a perf cost beyond one extra route-manifest entry.
- **`src/app/(storefront)/about/page.tsx` is a full client component for a page with zero real interactivity.** It's marketing copy + `framer-motion` entrance animations. Lines 10-18 implement a `mounted` state gate (`useState` + `useEffect`) purely to avoid an animation/hydration flash — this is a workaround that also forces the entire page (text, images, motion library) into client JS and blocks First Contentful Paint on hydration rather than SSR. A Server Component shell with `whileInView` scroll-triggered motion (no `mounted` gate needed) or CSS-only entrance would remove this page from the client bundle entirely.
- **`src/app/(storefront)/wishlist/page.tsx`, `account/page.tsx` are full client components with no server-rendered initial data.** Both fetch exclusively in a `useEffect` after mount (`wishlist/page.tsx:18-20`, and `account/page.tsx` relies on `useAuthStore` hydration). This means: blank paint → JS download/hydrate → client fetch → render, instead of server-rendering the initial state. Every visit costs a full extra client-server round trip that a Server Component + cookie-based fetch could eliminate. (Not the same finding as ISR-eligible pages — these are user-specific, so ISR isn't the fix; a server-rendered initial fetch using the session cookie is.)
- **`src/components/admin/ProductDrawer.tsx` is orphaned/dead code.** Grep confirms `ProductDrawer` is referenced in exactly one file — its own definition — and imported nowhere else in `src/`. It duplicates create/update/variant/image logic that already lives in `ProductForm.tsx` (used by `/admin/products/new` and `/admin/products/[id]/edit`, per `handover.md`'s Phase 4 notes). This is unused code shipping duplicate business logic that could drift from `ProductForm.tsx` silently.
- **43 of 116 `.ts(x)` files are `'use client'`** (~37%). Not inherently bad, but several (Navbar's static nav-link array, the About page) are client-only for reasons that look like convenience rather than necessity — see above.

### What Should Be Redesigned

1. Delete or redirect `/about-us` → `/about` (pick one canonical route); if both must exist for historical links, use a Next.js `redirect()` in `next.config.ts`, not a duplicate client bundle.
2. Convert `about/page.tsx` to a Server Component; replace the `mounted`-gate anti-flash hack with `whileInView`/CSS-only entrance so no client JS is required for a static content page.
3. Give `wishlist/page.tsx` and `account/page.tsx` a server-rendered initial shell (fetch via the session cookie in an `async` Server Component, hydrate the Zustand store from server-fetched props) instead of pure client `useEffect` fetching.
4. Resolve `ProductDrawer.tsx` — either wire it in somewhere intentional or remove it; right now it's dead code that duplicates `ProductForm.tsx`.

---
