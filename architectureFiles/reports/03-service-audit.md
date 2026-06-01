# Report 03 — Service Audit
**Phase:** 2.2 | **Date:** 2026-06-01 | **Status:** ✅ PASSED (after fixes)

---

## Summary

| Service | Supabase Direct | Transaction Needed | Severity | Status |
|---|---|---|---|---|
| productService.ts | ❌ None | ❌ No | — | ✅ PASS |
| categoryService.ts | ❌ None | ❌ No | — | ✅ CREATED |
| cartService.ts | ❌ None | ❌ No | — | ✅ PASS |
| wishlistService.ts | ❌ None | ❌ No | — | ✅ PASS |
| inventoryService.ts | ❌ None | ❌ No (RPCs are atomic) | — | ✅ PASS |
| couponService.ts | ❌ None | ❌ No (read-only) | — | ✅ PASS |
| orderService.ts | ✅ FIXED | ⚠️ Phase 3 | Critical→Fixed | ✅ FIXED* |

*Transaction deferred to Phase 3.

---

## Findings by Severity

### Critical — Fixed ✅

**orderService.ts — Direct Supabase call (architecture violation)**
- Before: `const { createClient } = await import('@/lib/db/server')` inside service; direct `.from('product_variants')` query
- After: Calls `ProductRepository.findVariantsByIds(variantIds)` — properly delegated
- Files changed: `orderService.ts`, `productRepository.ts`, `src/types/product.ts` (new `VariantSnapshot` type)

### High — Deferred (Phase 3)

**orderService.ts — No transaction wrapping**
- `create()` performs 8 sequential writes (order, order_items, inventory ×N, coupon_usage, coupon usage increment)
- If step 6+ fails after steps 4–5 succeed: order exists but inventory not decremented
- **Risk:** Low in practice (RPCs are atomic); higher if Supabase connection drops mid-operation
- **Phase 3 fix:** Wrap in PostgreSQL function or use Supabase edge function with transaction

### Compliant ✅

**productService.ts** — Pure delegation to ProductRepository. No logic issues.

**cartService.ts** — Validates stock before mutations. Combined-quantity check on `addItem` (existing + requested). Correct.

**inventoryService.ts** — All stock operations use RPC functions (atomic at DB level). Proper before/after logging.

**couponService.ts** — Comprehensive validation chain: expiry, usage limit, minimum order, user usage. Pure reads, no mutations.

**wishlistService.ts** — Clean toggle (check → remove or add). Correct.

---

## Business Logic Validation

### Inventory Flow
1. `cartService.addItem()` → checks stock before adding to cart ✅
2. `orderService.create()` → validates stock before creating order ✅
3. `orderService.create()` → decrements stock after order created ✅

### Coupon Flow
1. `couponService.validate()` → checks expiry ✅
2. `couponService.validate()` → checks usage_limit vs usage_count ✅
3. `couponService.validate()` → checks minimum order amount ✅
4. `couponService.validate()` → checks if user already used coupon ✅
5. `orderService.create()` → records usage + increments count after order ✅

### Stock Decrement Logic
- Uses `InventoryService.decrementStock()` → `InventoryRepository.decrementStock()` → `decrement_stock` RPC
- RPC uses `WHERE stock_available >= p_quantity` — race-condition safe at DB level ✅
- Logs before/after stock to `inventory_logs` ✅

---

## Verdict: ✅ PASS (Critical violation fixed; transaction risk documented for Phase 3)
