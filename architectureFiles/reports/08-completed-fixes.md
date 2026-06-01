# Report 08 — Completed Fixes
**Phase:** 2.2 | **Date:** 2026-06-01 | **Status:** ✅ ALL FIXES APPLIED

---

## Files Created (3)

| File | Purpose |
|---|---|
| `src/lib/validations/wishlistSchema.ts` | Extracted wishlist Zod schema from inline route definition |
| `src/lib/services/categoryService.ts` | New service layer for category operations |
| `architectureFiles/reports/` (10 files) | Phase 2.2 deliverable reports |

## Files Modified (7)

### `src/types/product.ts`
- **Added:** `VariantSnapshot` type (id, sku, color, size, price, productName, image)
- Used by `ProductRepository.findVariantsByIds()` and `OrderService`

### `src/lib/repositories/productRepository.ts`
- **Added import:** `VariantSnapshot` from `@/types/product`
- **Added method:** `findVariantsByIds(variantIds: string[]): Promise<VariantSnapshot[]>`
  - Queries `product_variants` joined to `products` and `product_images`
  - Returns computed price (price_override → sale_price → base_price)
  - Returns primary image URL

### `src/lib/services/orderService.ts`
- **Removed:** Dynamic `import('@/lib/db/server')` inside service method
- **Removed:** Direct `supabase.from('product_variants')` query (architecture violation)
- **Removed:** `const variant = variantRaw as any` and manual field extraction
- **Added import:** `VariantSnapshot` from `@/types/product`
- **Added:** Call to `ProductRepository.findVariantsByIds(items.map(i => i.variant_id))`
- **Result:** Service no longer touches Supabase directly ✅

### `src/lib/repositories/couponRepository.ts`
- **Changed:** `hasUserUsed()` from `.single()` to `.maybeSingle()`
- **Added:** `if (error) throw new Error(error.message)` — real errors now surface

### `src/lib/repositories/wishlistRepository.ts`
- **Changed:** `hasItem()` from `.single()` to `.maybeSingle()`
- **Added:** `if (error) throw new Error(error.message)` — real errors now surface

### `src/app/api/wishlist/route.ts`
- **Removed:** Inline `wishlistToggleSchema` definition
- **Added import:** `wishlistToggleSchema` from `@/lib/validations/wishlistSchema`
- **Changed:** POST `successResponse(result)` → `successResponse(result, 201)`

### `src/app/api/categories/route.ts`
- **Changed import:** `CategoryRepository` → `CategoryService`
- **Changed call:** `CategoryRepository.findWithChildren()` → `CategoryService.getWithChildren()`

---

## Build Verification

```
npx tsc --noEmit    → 0 errors ✅
npm run build       → ✅ Compiled successfully
```

Output:
```
✓ Compiled successfully in 5.7s
✓ Generating static pages (16/16) in 713ms
All 16 routes (7 static, 6 dynamic API, 3 dynamic pages) compiled
```
