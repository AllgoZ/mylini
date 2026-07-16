# Phase 6 — UX & Mobile Polish + Order Tracking
**Created:** 2026-07-16  
**Author:** Senior Product Designer + Full Stack Developer + DB Architect  
**Scope:** 5 tightly scoped improvements — NO other features touched

---

## Audit Summary

### Codebase State (pre-change)
| Area | File | Finding |
|---|---|---|
| Cart mobile | `cart/page.tsx:100` | `flex flex-col sm:flex-row` — on mobile (<640px) image stacks above content with misaligned fixed `w-28` |
| Checkout summary | `checkout/page.tsx:278` | `flex gap-4 items-center` — item row but long product names overflow; image has `-top-1.5 -right-1.5` badge that clips |
| Product detail CTA | `ProductDetailClient.tsx:92` | `toast.success()` only — no persistent "Go to Cart" nudge; no related products section |
| Customer orders | `orders/page.tsx` | Cards are not clickable; no detail page at `/orders/[id]`; no tracking display |
| Admin order detail | `admin/orders/[id]/page.tsx` | Status update only; no tracking number / URL fields |
| DB orders table | `orderRepository.ts:177` | `updateStatus()` writes `status` column only; no `tracking_number` / `tracking_url` columns |
| Order types | `types/order.ts:6` | `Order = Database[...]['orders']['Row']` — no tracking columns in generated types |
| Order statuses | `validations/adminOrderSchema.ts:4` | `pending, confirmed, paid, processing, shipped, delivered, cancelled, refunded` — no `packing` |

---

## Feature Breakdown

### Feature 1 — DB: Add Tracking Columns to Orders
**Risk:** Low — additive nullable columns, zero existing queries break

**Migration 031** (`src/lib/db/migrations/031_order_tracking.sql`):
```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url    text;
```

**Files changed:**
- `src/lib/db/migrations/031_order_tracking.sql` — new
- `src/lib/db/generated/database.types.ts` — regenerate after push (or manually add fields)
- `src/types/order.ts` — extend `OrderSummary` to include `tracking_number`, `tracking_url`

---

### Feature 2 — Admin: Tracking Number + URL on Order Detail
**Risk:** Low — additive UI section + one new repository method, status update unchanged

**What changes:**
- New card "Shipment Tracking" below "Update Status" in admin order detail
- Two inputs: Tracking Number (text), Tracking URL (URL)
- "Save Tracking" button → PATCH `/api/admin/orders/[id]` (extend existing route)
- Fields are pre-filled from saved `order.tracking_number` / `order.tracking_url`
- Hint: Show only when status is `processing`, `shipped`, or `delivered` (otherwise hidden with tooltip)

**Files changed:**
```
src/lib/validations/adminOrderSchema.ts     — add updateTrackingSchema
src/lib/repositories/orderRepository.ts    — add updateTracking() method
src/lib/services/orderService.ts           — add updateTracking() delegation
src/app/api/admin/orders/[id]/route.ts     — add PATCH handler (tracking)
src/app/admin/orders/[id]/page.tsx         — add TrackingSection UI
src/lib/api/admin/orders.ts               — add adminUpdateTracking() client fn
```

**API contract:**
```
PATCH /api/admin/orders/[id]
Body: { tracking_number?: string, tracking_url?: string }
Auth: requireAdmin()
Response: { data: Order, error: null, status: 200 }
```

---

### Feature 3 — Customer: Order Detail Page + Visual Status Timeline
**Risk:** Low — new page + make list cards clickable (no data changes)

**New route:** `src/app/(storefront)/orders/[id]/page.tsx`

**Visual status timeline (stepper):**
```
● Placed → ○ Confirmed → ○ Packed → ○ Shipped → ○ Delivered
```
- Each step: circle + label + date (if available; else greyed)
- Status → step mapping:
  - `pending`    → step 1 active
  - `confirmed`  → step 2 active
  - `paid`       → step 2 active (sub-step)
  - `processing` → step 3 active (Packed/Processing)
  - `shipped`    → step 4 active
  - `delivered`  → step 5 active
  - `cancelled`  → red "Cancelled" banner
  - `refunded`   → grey "Refunded" banner

**Tracking section (visible only when tracking_number exists):**
```
📦 Your order is on its way
Tracking #: DELHIVERY123456
[ Track Package → ]   (links to tracking_url if set)
```

**Other sections on order detail:**
- Order items list (with image snapshots)
- Delivery address
- Price breakdown

**Customer orders list change:**
- Make each card a `<Link href={/orders/${order.id}}>` wrapper
- Add a `>` chevron icon on right edge of card

**Files changed:**
```
src/app/(storefront)/orders/page.tsx          — wrap cards in Link
src/app/(storefront)/orders/[id]/page.tsx     — new file
src/lib/api/auth.ts                           — add getOrderById() client fn
src/app/api/orders/[id]/route.ts              — new (customer GET own order)
src/lib/repositories/orderRepository.ts       — findById already exists (admin uses it)
src/lib/services/orderService.ts              — add getById for customers (auth check)
src/types/order.ts                            — add tracking fields to OrderSummary
```

**Note on auth:** Customer order detail must verify `order.user_id === session.user_id` — use existing `getServerSession` pattern from auth API routes.

---

### Feature 4 — Cart & Checkout Mobile Alignment Fix
**Risk:** Low — CSS-only changes inside existing components

**Cart page fix** (`cart/page.tsx:100`):
- Change `flex flex-col sm:flex-row gap-5` → `flex gap-3`
- Change `w-28 h-36` image → `w-20 h-24 sm:w-28 sm:h-36` (smaller on mobile, correct aspect)
- This ensures horizontal row on ALL screen sizes with proper image sizing

**Checkout order summary fix** (`checkout/page.tsx:278`):
- The item row is already `flex gap-4 items-start`
- Add `min-w-0` to the name `<div>` to prevent text overflow
- Reduce image `w-16 h-16` → fine as-is; fix badge `absolute -top-1.5 -right-1.5` clipping by using `overflow-visible` on parent or moving badge to inner div

**Files changed:**
```
src/app/(storefront)/cart/page.tsx      — layout + image size fix
src/app/(storefront)/checkout/page.tsx  — overflow fix on item name div
```

---

### Feature 5 — Product Detail: Related Products + "View Cart" Bar
**Risk:** Low — additive to ProductDetailClient; no existing functionality changed

#### 5a — Related Products Section
Shown BELOW the product description, OUTSIDE the sticky details panel:

```
── You May Also Like ──────────────────────────
[ ProductCard ] [ ProductCard ] [ ProductCard ] [ ProductCard ]
← swipeable on mobile, 4-grid on desktop →
```

**Fetch strategy:**
- Client-side `useEffect` on mount
- Fetch: `GET /api/products?category_slug={slug}&exclude={productId}&limit=8`
- Category slug: available from `product.category.slug`
- If no category → skip silently
- Reuse existing `ProductCard` component (`src/components/shop/ProductCard.tsx`)
- On mobile: horizontal scroll strip (`overflow-x-auto flex gap-4 snap-x`)
- On desktop: `grid grid-cols-4 gap-4`

**Files changed:**
```
src/app/(storefront)/product/[slug]/ProductDetailClient.tsx — add RelatedProducts section
src/app/api/products/route.ts                               — add ?exclude=id query param
src/lib/validations/productSchema.ts                        — add exclude field
src/lib/repositories/productRepository.ts                   — pass exclude filter to query
```

#### 5b — "View Cart" Sticky Bar After Add-to-Cart
When user taps "Add to Cart" and it SUCCEEDS, show a persistent bottom bar for 4 seconds:

```
┌─────────────────────────────────────────────────────┐
│  ✓ Added to cart          [View Cart →]             │
└─────────────────────────────────────────────────────┘
```

- Appears at bottom, above mobile sticky CTA bar (`bottom-[72px]` on mobile, `bottom-4` on desktop)
- Slides up with Framer Motion, slides down to dismiss
- Auto-dismisses after 4s
- "View Cart →" → navigates to `/cart`
- If user taps it, it dismisses + navigates
- Only appears on successful add (not on error)

**Files changed:**
```
src/app/(storefront)/product/[slug]/ProductDetailClient.tsx — add state + ViewCartBar component
```

---

## Implementation Order

| # | Task | Complexity | Files | Blocks |
|---|---|---|---|---|
| 1 | DB migration 031 (tracking columns) | Low | 1 SQL | Nothing, do first |
| 2 | Repository + service + API (tracking) | Low | 4 files | Needs #1 |
| 3 | Admin order detail — tracking UI | Low | 2 files | Needs #2 |
| 4 | Cart + checkout mobile alignment | Low | 2 files | Independent |
| 5 | Customer order detail page | Medium | 5 files | Needs #1 |
| 6 | Customer orders list — clickable cards | Low | 1 file | Needs #5 |
| 7 | Related products on product detail | Medium | 4 files | Independent |
| 8 | View Cart bar after add-to-cart | Low | 1 file | Independent |

**Safe parallel pairs:** (4 + 8) can be done simultaneously; (7) standalone; (1→2→3) are sequential.

---

## DB Migration SQL

```sql
-- 031_order_tracking.sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url    text;
```

Run in Supabase SQL Editor OR `supabase db push --linked`.

---

## Strict Guards (DO NOT touch)

- `src/lib/middleware/adminMiddleware.ts` — admin auth, not touched
- `src/app/api/admin/auth/` — login route, not touched
- `src/store/useCartStore.ts` — cart logic, not touched
- `src/lib/services/orderService.ts` existing `create()` / `updateStatus()` methods
- All migration files 000–030 — read-only
- `netlify.toml` — not touched

---

## Acceptance Criteria

| Feature | Pass Condition |
|---|---|
| Tracking DB | `SELECT tracking_number, tracking_url FROM orders LIMIT 1` works |
| Admin tracking UI | Admin can save tracking number + URL on order detail; saved to DB |
| Customer order detail | `/orders/[id]` loads with stepper; tracking shown if set |
| Cart alignment | Cart items on 375px show image left + content right, no overflow |
| Checkout alignment | Checkout order summary items don't have text overflow on 375px |
| Related products | Product detail shows ≥1 related product card below description |
| View Cart bar | After add-to-cart, bottom bar appears for 4s with "View Cart →" button |
