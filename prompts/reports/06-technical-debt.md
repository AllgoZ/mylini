# Report 06 — Technical Debt
**Phase:** 2.2 | **Date:** 2026-06-01

---

## Debt Cleared in Phase 2.2

| Item | Status |
|---|---|
| Direct Supabase query in orderService | ✅ Fixed — now uses `ProductRepository.findVariantsByIds()` |
| Missing CategoryService | ✅ Fixed — `categoryService.ts` created |
| Inline Zod schema in wishlist route | ✅ Fixed — extracted to `wishlistSchema.ts` |
| Silent `!!data` in couponRepository.hasUserUsed | ✅ Fixed — `.maybeSingle()` + explicit error check |
| Silent `!!data` in wishlistRepository.hasItem | ✅ Fixed — `.maybeSingle()` + explicit error check |
| Wishlist POST returning 200 instead of 201 | ✅ Fixed — `successResponse(result, 201)` |

---

## Remaining Debt (Intentional — Deferred)

### High Priority — Phase 3

| Item | File | Risk | Fix |
|---|---|---|---|
| No PostgreSQL transaction in `OrderService.create()` | `orderService.ts` | Medium — partial write if step 6+ fails | Wrap in DB function or RPC transaction |

### Low Priority — Resolve After Type Generation

| Item | Files | Notes |
|---|---|---|
| `as any` casts in repositories | 6 of 7 repos | Intentional placeholder — disappear after `supabase gen types` |
| `as unknown as T` double casts | `orderRepository.ts:43`, `productRepository.ts:85` | Type mismatch from hand-crafted types — resolves after type gen |
| `(supabase as any).rpc(...)` | `inventoryRepository.ts` (×3), `couponRepository.ts` (×1) | No `Functions` block in types — resolves after type gen |

### Low Priority — Future Consideration

| Item | File | Notes |
|---|---|---|
| O(n×m) image `.find()` on listings | cart, product, wishlist repos | Acceptable now; optimize if images-per-product exceeds ~20 |
| Frontend pages still using mock data | `src/data/mockProducts.ts` | Phase 3 — wire pages to API after auth |
| No RLS policies | DB migrations | Phase 3 — add after Supabase Auth is configured |

---

## Type Generation Action (User-Triggered)

Once migrations 000–021 are deployed to Supabase:

```bash
npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts
npx tsc --noEmit
```

This eliminates all remaining `as any` casts and the `Functions` block absence.

---

## Debt Score

| Category | Before 2.2 | After 2.2 |
|---|---|---|
| Architecture violations | 3 | 0 ✅ |
| Silent errors | 2 | 0 ✅ |
| Code organisation issues | 2 | 0 ✅ |
| Intentional type placeholders | 15+ | 15+ (resolves with type gen) |
| Deferred transaction risk | 1 | 1 (Phase 3) |
