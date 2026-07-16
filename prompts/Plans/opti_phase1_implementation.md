# MYLINI Phase 1 — Critical Performance Optimizations — Implementation Plan

## Context

A full architecture/performance audit (`architectureFiles/audit_results.md`) already identified specific, file-and-line-verified issues. `prompts/Plans/opti_phase1.md` scopes which of those issues to fix now, under hard constraints: **no UI/design/layout changes, no business-logic changes, no regressions, everything visually identical.** This plan turns that spec into concrete, minimal-risk file changes, using only code paths and patterns that already exist in the codebase (e.g. mirroring `useWishStore`'s already-correct optimistic pattern into `useCartStore`, mirroring the existing `decrement_stock` RPC pattern for the new order-transaction RPC).

Two things are explicitly **out of scope** per `opti_phase1.md`'s own "VERY IMPORTANT" list and are not touched by this plan: auth/OTP/RLS changes, and admin UI. The security findings from the audit (phone-login bypass, RLS gap) are real but belong to a later phase per the user's own instructions.

---

## Task 1 — Atomic Order Creation (the critical fix)

**Problem (verified):** `orderService.ts:14-100` does a sequential `for`-loop calling `InventoryRepository.findByVariantId` once per item (validation), then a second sequential loop calling `InventoryService.decrementStock` once per item — which itself is 3 more sequential round trips (select, RPC, insert) per call. Net: **4N+2 sequential Supabase round trips per order**, no DB transaction, no rollback if a later step fails after an earlier one succeeded.

**Approach:** Move steps 5-8 (create order → insert items → decrement stock → log → record coupon usage) into a **single new Postgres RPC function**, called once, executed inside one implicit transaction (Postgres functions are transactional by default — any `RAISE EXCEPTION` rolls back everything the function did). This mirrors the existing `decrement_stock`/`reserve_stock` pattern in `021_create_rpc_functions.sql` (same `SECURITY DEFINER`, same atomic `WHERE stock_available >= quantity` race-condition guard), just scoped to the whole order instead of one variant.

**New migration** — `src/lib/db/migrations/030_order_transaction_rpc.sql` (+ matching timestamped copy in `supabase/migrations/`, per existing convention):

```sql
CREATE OR REPLACE FUNCTION create_order_transactional(
  p_user_id uuid, p_address_id uuid, p_coupon_id uuid,
  p_subtotal numeric, p_discount numeric, p_total numeric, p_notes text,
  p_items jsonb  -- [{variant_id, quantity, unit_price, total_price, product_name_snapshot, sku_snapshot, variant_snapshot, image_snapshot}]
) RETURNS orders
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order orders;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity int;
  v_new_stock int;
BEGIN
  -- Pass 1: lock + validate stock for every item before writing anything
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    PERFORM 1 FROM inventory WHERE variant_id = v_variant_id
      AND stock_available >= v_quantity FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_variant_id;
    END IF;
  END LOOP;

  INSERT INTO orders (user_id, address_id, coupon_id, status, subtotal, discount, total, notes)
  VALUES (p_user_id, p_address_id, p_coupon_id, 'pending', p_subtotal, p_discount, p_total, p_notes)
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price,
      product_name_snapshot, sku_snapshot, variant_snapshot, image_snapshot)
    VALUES (v_order.id, v_variant_id, v_quantity,
      (v_item->>'unit_price')::numeric, (v_item->>'total_price')::numeric,
      v_item->>'product_name_snapshot', v_item->>'sku_snapshot',
      v_item->>'variant_snapshot', v_item->>'image_snapshot');

    UPDATE inventory SET stock_available = stock_available - v_quantity, updated_at = NOW()
      WHERE variant_id = v_variant_id AND stock_available >= v_quantity
      RETURNING stock_available INTO v_new_stock;
    IF NOT FOUND THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_variant_id; END IF;

    INSERT INTO inventory_logs (variant_id, old_stock, new_stock, reason)
    VALUES (v_variant_id, v_new_stock + v_quantity, v_new_stock, 'purchase');
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES (p_coupon_id, p_user_id, v_order.id);
    UPDATE coupons SET usage_count = usage_count + 1, updated_at = NOW()
      WHERE id = p_coupon_id AND (usage_limit IS NULL OR usage_count < usage_limit)
        AND (expires_at IS NULL OR expires_at > NOW());
    IF NOT FOUND THEN RAISE EXCEPTION 'COUPON_INVALID:%', p_coupon_id; END IF;
  END IF;

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION create_order_transactional(uuid,uuid,uuid,numeric,numeric,numeric,text,jsonb) TO anon;
```

**Code changes:**
- `orderRepository.ts`: add `createTransactional(input)` calling `supabase.rpc('create_order_transactional', {...})`. On a Postgrest error, parse the `INSUFFICIENT_STOCK:<uuid>` / `COUPON_INVALID:<uuid>` prefix from `error.message` and throw **the same error types/messages the current code throws** (`ValidationError('Insufficient stock for variant ${id}')` etc.) so nothing downstream (API route, frontend error toasts) sees a behavior change.
- `orderService.ts`: replace steps 1 and 5-8 (the two loops + order/items/coupon-usage writes) with: keep the existing JS-side snapshot/subtotal/coupon-validate logic exactly as-is (steps 2-4, unchanged), then one call to `OrderRepository.createTransactional(...)`. Remove now-unused `InventoryRepository`/loop code from this file (Task 10 — dead code cleanup, scoped to this file only).
- `inventoryService.ts`/`inventoryRepository.ts`: **untouched** — `reserveStock`/`releaseStock`/`decrementStock` (standalone) remain for any other caller; only `orderService.ts`'s use of the loop is replaced.

**Rollout note:** this requires deploying a new migration to the **live** Supabase project (`npx supabase db push --linked`, per `CLAUDE.md`). The migration file is written and shown before that command is run, and it is not run without explicit confirmation, since it changes live production schema.

---

## Task 2 & 7 — Duplicate Reads / Repeated Requests

Verified duplicate-read sites, all fixable without touching business logic:

1. **`checkout/page.tsx:24-25`** — unconditionally calls `fetchCart()` and `hydrate()` on every mount, even though `AuthProvider` (mounted once in `(storefront)/layout.tsx`, persists across in-app navigation) already hydrates auth, and `Navbar` already guards its cart fetch. Fix: apply the same guard `Navbar.tsx:23` already uses — `if (!useCartStore.getState().cart) fetchCart()` — and remove the redundant `hydrate()` call entirely (the layout-level `AuthProvider` already guarantees hydration runs, including on hard refresh, since it's part of the same layout tree that wraps `/checkout`).
2. **`cartService.mergeGuestCartToUser`** (`cartService.ts:60-98`) — re-fetches the *entire* user cart with `CartRepository.getWithItems(userCart.id)` **inside** the per-guest-item loop (`:79`), once per item, purely to check if that one variant already exists. Fix: fetch the user cart's items **once** before the loop, track merged quantities in a local `Map` as the loop progresses, and only call `getWithItems` again once at the very end to return the final state (matches the function's existing return contract exactly — no behavior change, just removes N-1 redundant full-cart re-fetches during login/cart-merge).

Not changed: `wishlist/page.tsx`'s `fetchWishlist()` guard (`if (user) fetchWishlist()`) was reviewed and is already correctly scoped — no duplicate-fetch evidence found there.

---

## Task 3 — Homepage Query Merge

**Problem (verified):** `page.tsx:37-38` makes two separate `HomepageService.getByType()` calls (`'banner'`, `'promo_block'`) that only differ by filter value on the same column.

**Fix:** Add `HomepageRepository.findByTypes(types: HomepageSectionType[])` using `.in('section_type', types).order('section_type').order('sort_order')` (mirrors the existing `findAll()` ordering pattern so results stay grouped/ordered per type), and `HomepageService.getByTypes(types)`. In `page.tsx`, replace the two calls with one `HomepageService.getByTypes(['banner', 'promo_block'])`, then split the result client-side: `sections.find(s => s.section_type === 'banner')` and `sections.filter(s => s.section_type === 'promo_block')`. Output is byte-identical to today — same rows, same order, just fetched in one round trip instead of two.

**Explicitly not merged:** the three `ProductService.list()` calls (best sellers / new arrivals / featured) — they use different filters and limits, and "featured" is actually just the latest 8 active products with no flag filter (confirmed by reading `page.tsx:36`). Merging these would require restructuring the query shape and risks changing which products appear where — out of scope for a "maintain identical output" task.

---

## Task 4 — Cart Optimistic Updates

**Problem (verified):** `useCartStore.ts` awaits the full server round trip before updating `cart` state on every `addItem`/`updateItem`/`removeItem` call — unlike `useWishStore.toggleItem` (`useWishStore.ts:33-76`), which is already correctly optimistic (updates local state immediately, rolls back on failure).

**Approach — mirror the existing wishlist pattern, scoped by what data is already available at each call site:**

- **`updateItem` / `removeItem`** (called only from `cart/page.tsx:24,29`, which already has the full `CartItem` object in `cart.items`): make these truly optimistic. Snapshot the current `cart`, apply the change locally (update quantity / splice out the item, recompute `subtotal`/`item_count` client-side using the same formula `CartRepository.getWithItems` uses), `set()` immediately, then call the API in the background; on success replace with the authoritative server `cart`, on failure roll back to the snapshot and surface the existing error toast (already handled by the call sites in `cart/page.tsx:24-31`, unchanged).
- **`addItem`** (real call site: `ProductDetailClient.tsx:71-82`, which has both `product` and `selectedVariant` in scope — the wishlist page's `addItem` destructure is unused dead code, left untouched since touching it isn't required for this task). Extend `addItem`'s signature with an **optional** `optimisticItem` parameter built from data the caller already has (variant id/sku/color/size/price_override + product id/name/slug/base_price/sale_price + primary image) — shaped exactly like `CartItem` (`types/cart.ts:8-19`). When provided, the store immediately merges it into `cart.items` (bumping quantity if that variant is already present, matching `CartService.addItem`'s own merge behavior) and recomputes subtotal/count locally, then reconciles with the server response afterward (or rolls back on error). If a future caller doesn't pass `optimisticItem`, behavior falls back exactly to today's await-then-set — no regression risk for any untouched call site.

---

## Task 5 — Wishlist Optimistic Updates

**Verified: already correct, no changes needed.** `useWishStore.toggleItem` (`useWishStore.ts:33-76`) already updates `productIds`/`items` immediately, calls the API, and rolls back on failure.

---

## Task 6 — Cache Improvements

**Constraint check:** wrapping `ProductRepository`/`CategoryRepository`/`HomepageRepository` calls directly in `unstable_cache()` is unsafe as a first move — all of them go through `createClient()` (`db/server.ts`), which calls Next's `cookies()` internally, and Next.js explicitly disallows/warns against reading `cookies()` inside an `unstable_cache()`-wrapped function. Building a cookie-free client variant for these public reads is a reasonable follow-up, but it's new surface area beyond what's needed for Phase 1.

**What Phase 1 actually needs** is already provided by the existing route-level ISR (`revalidate = 60` on the 3 main pages) — the missing piece is that admin writes don't invalidate it early. Fix: call **`revalidatePath()`** from the admin write routes, immediately after a successful mutation:
- `api/admin/products/route.ts` (POST) and `api/admin/products/[id]/route.ts` (PATCH/DELETE) → `revalidatePath('/')`, `revalidatePath('/shop/[category]', 'page')`, `revalidatePath('/product/[slug]', 'page')`
- `api/admin/content/sections/route.ts` → `revalidatePath('/')`
- `api/admin/categories/route.ts` → `revalidatePath('/')`, `revalidatePath('/shop/[category]', 'page')`

No caching is added anywhere for cart, checkout, session, or inventory.

---

## Task 8 — Image Optimization

1. **`wishlist/page.tsx:118`** renders `product.image` directly with no Cloudinary transform, unlike every other product-image render site in the app. Fix: wrap with `getCardImageUrl(product.image)`.
2. **`next.config.ts`** doesn't set `images.formats`. Fix: add `images.formats: ['image/avif', 'image/webp']`.

Not doing in Phase 1: blur placeholders (a visible loading-state change, out of scope given "Do NOT change appearance").

---

## Task 9 — Request/Payload Optimization

**Verified:** `productRepository.ts`'s `DETAIL_SELECT_INNER` (used only by `findBySlug`, the customer-facing product page) selects `*` on the `products` row, including `meta_title`, `meta_description`, `canonical_url`, `og_image`, and `search_vector` — none of which `ProductDetailClient.tsx` reads.

**Fix:** replace `DETAIL_SELECT_INNER`'s leading `*` with an explicit column list matching what `ProductDetailClient` actually uses. `DETAIL_SELECT_LEFT` (admin) is left as `*`.

---

## Task 10 — Code Quality (scoped to files touched above only)

- `orderService.ts`: remove the now-unused sequential-loop code and `InventoryRepository` import once Task 1 replaces it.
- `cartService.ts`: remove the redundant `getWithItems` calls inside the merge loop once Task 2 replaces them with local tracking.

Broader dead-code items from the audit (`ProductDrawer.tsx`, unused `roles`/`permissions`/`user_roles` tables) are **not** touched.

---

## Files Touched (summary)

| File | Change |
|---|---|
| `src/lib/db/migrations/030_order_transaction_rpc.sql` (new) + `supabase/migrations/<timestamp>_order_transaction_rpc.sql` (new) | New atomic order-creation RPC |
| `src/lib/repositories/orderRepository.ts` | Add `createTransactional()`, error-message parsing |
| `src/lib/services/orderService.ts` | Replace loops with one RPC call; remove dead code |
| `src/app/(storefront)/checkout/page.tsx` | Guard cart fetch, remove redundant hydrate |
| `src/lib/services/cartService.ts` | Remove N+1 re-fetch inside `mergeGuestCartToUser` loop |
| `src/lib/repositories/homepageRepository.ts` | Add `findByTypes()` |
| `src/lib/services/homepageService.ts` | Add `getByTypes()` |
| `src/app/(storefront)/page.tsx` | Merge banner+promo fetch into one call |
| `src/store/useCartStore.ts` | Optimistic `updateItem`/`removeItem`/`addItem` |
| `src/app/(storefront)/product/[slug]/ProductDetailClient.tsx` | Pass `optimisticItem` to `addItem` |
| `src/app/api/admin/products/route.ts`, `.../[id]/route.ts`, `api/admin/content/sections/route.ts`, `api/admin/categories/route.ts` | Add `revalidatePath()` after writes |
| `src/app/(storefront)/wishlist/page.tsx` | Use `getCardImageUrl()` |
| `next.config.ts` | Add `images.formats` |
| `src/lib/repositories/productRepository.ts` | Trim `DETAIL_SELECT_INNER` columns |

## Verification Plan

1. `npx tsc --noEmit` and lint after each task group — must stay at 0 errors.
2. Manual walkthrough: add to cart, adjust quantity, remove item, checkout end-to-end (including a deliberately-triggered insufficient-stock case), apply a coupon, homepage load, wishlist toggle, mobile + desktop.
3. Before deploying the new migration to the live Supabase project, confirm separately — this is the one step in this phase that touches production schema.
4. After implementation, produce the report in the exact format `opti_phase1.md` specifies (Files Changed / Database Changes / Performance Improvements / Supabase Reads Saved / Supabase Writes Saved / Latency Improvement / Risks / Manual Testing Checklist).
