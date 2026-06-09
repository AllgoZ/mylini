# Report 04 — API Audit
**Phase:** 2.2 | **Date:** 2026-06-01 | **Status:** ✅ PASSED (after fixes)

---

## Summary

| Route | Methods | Zod Schema | Service Layer | Status Codes | Status |
|---|---|---|---|---|---|
| /api/products | GET | ✅ productSchema | ✅ ProductService | 200/400/500 | ✅ PASS |
| /api/products/[slug] | GET | path param | ✅ ProductService | 200/404/500 | ✅ PASS |
| /api/categories | GET | no input | ✅ CategoryService | 200/500 | ✅ FIXED |
| /api/cart | GET/POST/PATCH/DELETE | ✅ cartSchema | ✅ CartService | 200/201/400/500 | ✅ PASS |
| /api/wishlist | GET/POST | ✅ wishlistSchema | ✅ WishlistService | 200/201/400/500 | ✅ FIXED |
| /api/orders | POST | ✅ checkoutSchema | ✅ OrderService | 201/400/409/500 | ✅ PASS |

---

## Findings by Severity

### Low — Fixed ✅

**api/wishlist/route.ts — Inline Zod schema**
- Before: Schema defined inline in route file (lines 5–8)
- After: Schema extracted to `src/lib/validations/wishlistSchema.ts`, imported
- Consistent with all other routes

**api/wishlist/route.ts — POST returns 200 instead of 201**
- Before: `return successResponse(result)` — defaults to 200
- After: `return successResponse(result, 201)` — correct REST code for resource creation

**api/categories/route.ts — Skipped service layer**
- Before: Calls `CategoryRepository.findWithChildren()` directly
- After: Calls `CategoryService.getWithChildren()` — consistent with architecture rule

---

## Request Validation

| Route | Schema | Validates |
|---|---|---|
| GET /api/products | productQuerySchema | category, search, status, featured, bestSeller, newArrival, sort, page, limit |
| POST /api/cart | addCartItemSchema | variant_id (UUID), quantity (1–99), session_id |
| PATCH /api/cart | updateCartItemSchema | variant_id (UUID), quantity (1–99), session_id |
| DELETE /api/cart | removeCartItemSchema | variant_id (UUID), session_id |
| POST /api/wishlist | wishlistToggleSchema | user_id (UUID), product_id (UUID) |
| POST /api/orders | checkoutSchema | user_id, address_id, items[], coupon_code?, notes? |

---

## Next.js 16 Compliance

- `GET /api/products/[slug]/route.ts` — params correctly awaited: `const { slug } = await params` ✅
- All other routes: no dynamic params — not applicable ✅

---

## Error Handling

- All routes wrapped in `try/catch` ✅
- All use `errorResponse(error)` helper from `apiResponse.ts` ✅
- `errorResponse` handles: `ZodError` (400), `NotFoundError` (404), `InsufficientStockError` (409), `CouponError` (400), generic (500) ✅
- Zod v4 uses `.issues` (not `.errors`) — correct ✅

---

## Pagination (GET /api/products)
- `page` param (default: 1, min: 1) ✅
- `limit` param (default: 20, min: 1, max: 100) ✅
- Response includes `count`, `page`, `limit`, `totalPages` ✅

---

## Search (GET /api/products)
- `search` param triggers `.textSearch('search_vector', query, { type: 'plain' })` ✅
- Uses PostgreSQL FTS with GIN index ✅

---

## Verdict: ✅ PASS
