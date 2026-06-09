# Report 09 — Test Results
**Phase:** 2.2 | **Date:** 2026-06-01

---

## Build Tests (Automated)

| Test | Command | Result |
|---|---|---|
| TypeScript check | `npx tsc --noEmit` | ✅ 0 errors |
| Production build | `npm run build` | ✅ Compiled successfully |

### Build Output
```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 5.7s
✓ Running TypeScript — Finished in 8.6s
✓ Generating static pages (16/16) in 713ms

Routes compiled:
  ○ /           (static)
  ○ /about      (static)
  ○ /about-us   (static)
  ○ /cart       (static)
  ○ /checkout   (static)
  ○ /collections (static)
  ○ /contact    (static)
  ○ /wishlist   (static)
  ƒ /api/cart          (dynamic)
  ƒ /api/categories    (dynamic)
  ƒ /api/orders        (dynamic)
  ƒ /api/products      (dynamic)
  ƒ /api/products/[slug] (dynamic)
  ƒ /api/wishlist      (dynamic)
  ƒ /product/[id]      (dynamic)
  ƒ /shop/[category]   (dynamic)
```

---

## API Tests (Pending — Requires Live Database)

Database has not been deployed to Supabase yet. API tests below are the definitive checklist to run once migrations are applied and seed data is loaded.

### Product API

| Test | Endpoint | Expected Result | Status |
|---|---|---|---|
| List products | `GET /api/products` | 200, 4 items (after seed) | ⏳ Pending |
| Search pattu | `GET /api/products?search=pattu` | 200, 1+ results | ⏳ Pending |
| Paginate | `GET /api/products?page=1&limit=2` | 200, 2 items, totalPages=2 | ⏳ Pending |
| Filter category | `GET /api/products?category=girls-traditional` | 200, 2 items | ⏳ Pending |
| Single product | `GET /api/products/pattu-pavadai-set` | 200, variants + images | ⏳ Pending |
| Invalid slug | `GET /api/products/does-not-exist` | 404 | ⏳ Pending |
| Invalid limit | `GET /api/products?limit=999` | 400 (Zod validation) | ⏳ Pending |

### Category API

| Test | Endpoint | Expected Result | Status |
|---|---|---|---|
| Category tree | `GET /api/categories` | 200, 4 categories (after seed) | ⏳ Pending |
| Parent-child | Verify tree structure | children array on parent | ⏳ Pending |

### Cart API

| Test | Endpoint | Expected Result | Status |
|---|---|---|---|
| Add item | `POST /api/cart` | 200, cart with 1 item | ⏳ Pending |
| Get cart | `GET /api/cart?session_id=abc` | 200, cart contents | ⏳ Pending |
| Update quantity | `PATCH /api/cart` | 200, updated quantity | ⏳ Pending |
| Remove item | `DELETE /api/cart` | 200, item removed | ⏳ Pending |
| Duplicate add | `POST /api/cart` same variant | 200, merged quantity | ⏳ Pending |
| Over-stock add | quantity > stock_available | 409, stock error | ⏳ Pending |

### Wishlist API

| Test | Endpoint | Expected Result | Status |
|---|---|---|---|
| Toggle (add) | `POST /api/wishlist` | **201**, action: "added" | ⏳ Pending |
| Toggle (remove) | `POST /api/wishlist` same product | **201**, action: "removed" | ⏳ Pending |
| Get wishlist | `GET /api/wishlist?user_id=...` | 200, items array | ⏳ Pending |
| Missing user_id | `GET /api/wishlist` | 400, validation error | ⏳ Pending |

### Order API

| Test | Endpoint | Expected Result | Status |
|---|---|---|---|
| Create order | `POST /api/orders` | 201, order with status: pending | ⏳ Pending |
| With coupon | `POST /api/orders` + coupon_code | 201, discount applied | ⏳ Pending |
| Invalid coupon | bad coupon_code | 400, coupon error | ⏳ Pending |
| Out of stock | quantity > available | 409, stock error | ⏳ Pending |
| Check inventory | after order creation | stock_available decremented by quantity | ⏳ Pending |
| Inventory snapshot | order_items fields | product_name_snapshot, sku_snapshot populated | ⏳ Pending |

---

## To Run API Tests

1. Deploy migrations 000–021 (see `scripts/deploy-migrations.md`)
2. Seed data: run `scripts/seed.sql` in Supabase SQL Editor
3. Generate types: `npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts`
4. Start dev server: `npm run dev`
5. Run each test case above using curl or browser DevTools

### Sample curl commands

```bash
# List products
curl http://localhost:3000/api/products

# Search
curl "http://localhost:3000/api/products?search=pattu"

# Category tree
curl http://localhost:3000/api/categories

# Add to cart
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"variant_id":"<uuid>","quantity":2,"session_id":"test-session-1"}'

# Toggle wishlist
curl -X POST http://localhost:3000/api/wishlist \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","product_id":"<uuid>"}'

# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","address_id":"<uuid>","items":[{"variant_id":"<uuid>","quantity":1}]}'
```
