# Checkout / Order Details Fixes — Implementation Plan

Client reported 6 issues via screenshots. Investigated each against the live codebase.
4 are fully understood root causes with a clear fix. 2 are ambiguous and are **not**
being touched — flagged to the client for clarification instead.

## Issues being fixed

### 1. Product image missing in Order Details ("Items Ordered")
**Root cause:** `ProductRepository.findVariantsByIds()` (used by `OrderService.create` to
build the order-item snapshot at checkout time) joins `product_images` directly under
`product_variants`. `product_images.variant_id` is never populated by the admin panel —
images are attached via `product_id` — so this join always returns empty, and every new
order's `image_snapshot` gets saved as `null`. Same root-cause class as the cart/checkout
thumbnail bug fixed earlier this session (`cartRepository.ts`), just a different query that
was missed.
**Fix:** change the join to `product:products!inner(..., images:product_images(...))`,
mirroring `cartRepository.ts`'s already-fixed query shape.
**File:** `src/lib/repositories/productRepository.ts`
**Caveat:** this only fixes *future* orders — `image_snapshot` is a point-in-time snapshot
column, so orders already placed keep their stored `null`. Not backfilling existing orders
(not asked for, and would be a separate data-cleanup decision).

### 2. Shipping charge shown as "Free" in Order Details, even when checkout charged shipping
**Root cause, larger than it looks:** the `orders` table has no `shipping` or `tax` column
at all. `OrderService.create()` computes `total = subtotal - discount` — it silently drops
shipping and tax entirely when persisting the order, even though the checkout page shows
the customer `subtotal - discount + shipping + tax` as the amount to pay. The order details
page's "Free" label isn't reading real data — it's a hardcoded string, because there's
nothing real to read. Net effect: the order's stored `total` can be lower than what the
customer was actually shown/charged at checkout.
**Fix (server-side, not trusting client-sent amounts — same trust model already used for
subtotal, which is recomputed from live variant prices, not the client's number):**
- Migration 040 — add `shipping_charge NUMERIC NOT NULL DEFAULT 0` and
  `tax_amount NUMERIC NOT NULL DEFAULT 0` to `orders`.
- `create_order_transactional` RPC — accept `p_shipping`, `p_tax`, store them, and use them
  in the persisted total.
- `OrderService.create()` — fetch `SettingsRepository.getSettings()` and compute
  `shipping`/`tax` with the exact same formula the checkout page already uses
  (`subtotal > free_shipping_threshold ? 0 : shipping_charge`,
  `Math.round(subtotal * tax_rate / 100)`), so the persisted total always matches what the
  customer was shown.
- `OrderRepository.createTransactional` — pass the new params through.
- Order details page — show the real `order.shipping_charge` (still label it "Free" when
  it's actually 0) and a `Tax` line when `order.tax_amount > 0`, mirroring the checkout
  page's own layout.
**Files:** new migration (`src/lib/db/migrations/040_*.sql` +
`supabase/migrations/20240101000040_*.sql`), `src/lib/services/orderService.ts`,
`src/lib/repositories/orderRepository.ts`, `src/lib/db/migrations/030_order_transaction_rpc.sql`
(new migration replaces the function, original file untouched），
`src/app/(storefront)/orders/[id]/page.tsx`, `src/types/order.ts`.
**Explicitly out of scope:** this does NOT change whether checkout charges tax at all, or
how it's displayed at checkout — that's issue #1 below (unclear, not touched). This only
makes sure whatever checkout already computes and shows is what actually gets billed and
then correctly redisplayed afterward.
**Requires a manual step from you:** run the new migration 040 in the Supabase SQL editor
(this project has no automatic migration runner — every migration here is applied by hand).

### 3. "Total paid" shown on a COD order that hasn't been paid yet
**Root cause:** the order-confirmation screen always shows "Total paid: ₹X" regardless of
payment method. COD literally means nothing has been paid — the wording is just wrong.
**Fix:** change the label from "Total paid" to "Order Total" (COD is the only payment
method right now, so no conditional needed).
**File:** `src/app/(storefront)/checkout/page.tsx`

### 4. Company name on Contact page
**Fix:** change "Mylini Ethnic Wear Studio" → "Mylini Ventures".
**File:** `src/app/(storefront)/contact/page.tsx`

## Issues NOT being fixed — flagged for clarification

### A. "Tax should be inclusive — it could not be calculated at the time of checkout"
Ambiguous. Two very different things this could mean:
- Remove the separate "Tax" line entirely and treat displayed prices as already
  tax-inclusive (i.e. stop adding tax on top of subtotal at checkout).
- Something about the *accuracy* of the tax number itself (e.g. GST split by
  origin/destination state) being wrong, not the fact that it's shown separately.
Implementing the wrong interpretation means either silently changing what customers get
charged, or leaving the real complaint unaddressed. Not touching checkout's tax
computation/display until this is clarified.

### B. "Estimated delivery time should be displayed once pincode is filled"
No delivery-time-by-pincode logic, zone table, or courier API integration exists anywhere
in this codebase today. This is a new feature, not a bug — it needs a decision on the
underlying logic (flat X days for all pincodes? zone/state-based? a courier API lookup?)
before it can be built. Not building a guessed version of it.

## Verification plan
- `npx tsc --noEmit`, `npm run build`
- Live: place a real COD test order through the dev server (with a variant that has a
  product image, and with subtotal below the free-shipping threshold so shipping is
  non-zero) and confirm: order confirmation says "Order Total" not "Total paid", order
  detail page shows the product image, shipping charge matches what checkout charged, and
  the total matches too. Clean up the test order afterward.
