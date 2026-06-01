# Report 05 — Architecture Violations
**Phase:** 2.2 | **Date:** 2026-06-01 | **Status:** ✅ ALL VIOLATIONS RESOLVED

---

## Rule Definitions

| Rule | Description |
|---|---|
| ARCH-01 | No Supabase access outside repositories |
| ARCH-02 | No business logic inside API routes |
| ARCH-03 | All input validated with Zod before service call |
| ARCH-04 | All Zod schemas defined in `src/lib/validations/` |
| ARCH-05 | All API routes call service layer (not repository directly) |

---

## Violations Found & Fixed

### ARCH-01 — Supabase in Service Layer ✅ FIXED

**Violation:** `src/lib/services/orderService.ts`
- Direct `import('@/lib/db/server')` and `.from('product_variants')` query inside a service
- Bypassed `ProductRepository` to fetch variant snapshot data

**Fix applied:**
- Added `ProductRepository.findVariantsByIds(variantIds: string[])` method
- `orderService.ts` now calls repository; no Supabase import in services

### ARCH-04 — Inline Schema ✅ FIXED

**Violation:** `src/app/api/wishlist/route.ts`
- Zod schema defined inline in route file instead of `src/lib/validations/`

**Fix applied:**
- Created `src/lib/validations/wishlistSchema.ts`
- Route now imports `wishlistToggleSchema` from validations

### ARCH-05 — Route Bypassing Service ✅ FIXED

**Violation:** `src/app/api/categories/route.ts`
- Called `CategoryRepository.findWithChildren()` directly
- No `CategoryService` existed

**Fix applied:**
- Created `src/lib/services/categoryService.ts`
- Route now calls `CategoryService.getWithChildren()`

---

## Full Scan Results (No Violations Remaining)

### Supabase Imports in Frontend Pages (`src/app/` non-api)
```
Scan: grep -r "from '@/lib/db'" src/app/ --include="*.tsx" --include="*.ts" (excluding api/)
Result: 0 matches ✅
```

### Business Logic in API Routes
```
Scan: reviewed all 6 route files for conditional logic beyond validation
Result: 0 violations — all routes validate → delegate → respond ✅
```

### Missing Zod Validation
```
Scan: all routes with request body or query params
Result: all schemas present — GET /categories (no input), GET /products/[slug] (path param only) are exempt ✅
```

### Direct DB Calls in Services
```
Scan: grep -r "createClient\|supabase\|from('@/lib/db')" src/lib/services/
Result: 0 matches after orderService fix ✅
```

---

## Verdict: ✅ ALL CLEAN — No architecture violations remain
