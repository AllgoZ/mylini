# Report 07 — Remediation Plan
**Phase:** 2.2 | **Date:** 2026-06-01 | **Status:** ✅ EXECUTED

---

## Priority Order

### Priority 1 — Critical (Architecture Violations)

**A1 — Add `ProductRepository.findVariantsByIds()`**
- File: `src/lib/repositories/productRepository.ts`
- Add new method that queries `product_variants` joined to `products` and `product_images`
- Return type: `VariantSnapshot[]` (new type in `src/types/product.ts`)

**A2 — Fix `orderService.ts` direct Supabase call**
- File: `src/lib/services/orderService.ts`
- Remove dynamic import of `createClient` and direct `.from('product_variants')` query
- Replace with `ProductRepository.findVariantsByIds(items.map(i => i.variant_id))`

### Priority 2 — Medium (Data Safety)

**C1 — Fix `couponRepository.hasUserUsed()` silent error**
- File: `src/lib/repositories/couponRepository.ts`
- Change `.single()` to `.maybeSingle()` and add explicit `if (error) throw`

**C2 — Fix `wishlistRepository.hasItem()` silent error**
- File: `src/lib/repositories/wishlistRepository.ts`
- Change `.single()` to `.maybeSingle()` and add explicit `if (error) throw`

### Priority 3 — Low (Code Quality)

**B1 — Extract wishlist Zod schema**
- Create: `src/lib/validations/wishlistSchema.ts`
- Update: `src/app/api/wishlist/route.ts` — import from new file

**B2 — Fix wishlist POST status code**
- File: `src/app/api/wishlist/route.ts`
- Change `successResponse(result)` → `successResponse(result, 201)`

**B3 — Create CategoryService**
- Create: `src/lib/services/categoryService.ts`
- Update: `src/app/api/categories/route.ts` — use service

---

## Deferred (Phase 3)

- PostgreSQL transaction wrapping for `OrderService.create()`
- RLS policy implementation
- Supabase Auth integration
