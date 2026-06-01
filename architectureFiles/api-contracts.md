# API Contracts — MYLINI v2 Phase 2.1 Testing Guide

**Version:** Phase 2.1  
**Status:** All endpoints ready for integration testing  
**Database:** Empty (seed with `scripts/seed.sql` for testing)

---

## API Base URL

```
http://localhost:3000/api
```

All responses follow this envelope:

```json
{
  "data": <T> | null,
  "error": string | null,
  "status": number
}
```

---

## Endpoints

### 1. GET /products — List Products with Filtering

**Purpose:** Retrieve paginated list of products with optional filters.

**Query Parameters:**

| Param | Type | Default | Example | Notes |
|---|---|---|---|---|
| `category` | string (slug) | - | `girls-traditional` | Filter by category slug (optional) |
| `search` | string | - | `pattu` | Full-text search on name + description (optional) |
| `status` | `active` \| `draft` \| `archived` | `active` | `active` | Product status filter |
| `featured` | boolean | false | `true` | Filter by featured flag |
| `bestSeller` | boolean | false | `true` | Filter by best-seller flag |
| `newArrival` | boolean | false | `true` | Filter by new arrival flag |
| `sort` | `price_asc` \| `price_desc` \| `newest` \| `popular` | `newest` | `price_asc` | Sort order |
| `page` | integer | 1 | `2` | Page number (1-indexed) |
| `limit` | integer (1–100) | 20 | `10` | Results per page |

**Example Request:**

```bash
curl "http://localhost:3000/api/products?category=girls-traditional&limit=5&page=1"
```

**Success Response (200):**

```json
{
  "data": {
    "items": [
      {
        "id": "uuid-1",
        "name": "Pattu Pavadai Set",
        "slug": "pattu-pavadai-set",
        "base_price": 3500,
        "sale_price": 2999,
        "status": "active",
        "is_featured": true,
        "is_best_seller": true,
        "category": {
          "id": "uuid-cat",
          "name": "Girls Traditional",
          "slug": "girls-traditional"
        },
        "images": [
          {
            "id": "uuid-img",
            "public_url": "https://...",
            "is_primary": true
          }
        ]
      }
    ],
    "count": 4,
    "page": 1,
    "limit": 5,
    "totalPages": 1
  },
  "error": null,
  "status": 200
}
```

**Empty Results (200):**

```json
{
  "data": {
    "items": [],
    "count": 0,
    "page": 1,
    "limit": 5,
    "totalPages": 0
  },
  "error": null,
  "status": 200
}
```

**Validation Error (400):**

```json
{
  "data": null,
  "error": "page: Expected integer, limit: Must be between 1 and 100",
  "status": 400
}
```

---

### 2. GET /products/[slug] — Get Product Details

**Purpose:** Retrieve full product details including variants, images, and attributes.

**Path Parameters:**

| Param | Type | Example |
|---|---|---|
| `slug` | string | `pattu-pavadai-set` |

**Example Request:**

```bash
curl "http://localhost:3000/api/products/pattu-pavadai-set"
```

**Success Response (200):**

```json
{
  "data": {
    "id": "uuid-1",
    "name": "Pattu Pavadai Set",
    "slug": "pattu-pavadai-set",
    "description": "Beautiful silk pavadai...",
    "base_price": 3500,
    "sale_price": 2999,
    "status": "active",
    "is_featured": true,
    "is_best_seller": true,
    "category": {
      "id": "uuid-cat",
      "name": "Girls Traditional",
      "slug": "girls-traditional"
    },
    "variants": [
      {
        "id": "uuid-var-1",
        "sku": "PATTU-GLD-2Y",
        "color": "Gold",
        "size": "2Y",
        "price_override": null,
        "inventory": {
          "stock_available": 10,
          "stock_reserved": 0,
          "low_stock_threshold": 2
        },
        "images": [
          {
            "id": "uuid-img",
            "public_url": "https://...",
            "is_primary": true
          }
        ]
      }
    ],
    "attributes": [
      {
        "attribute_name": "fabric_type",
        "attribute_value": "Silk"
      },
      {
        "attribute_name": "gender",
        "attribute_value": "Girls"
      }
    ],
    "images": [
      {
        "id": "uuid-img",
        "public_url": "https://...",
        "is_primary": true,
        "storage_provider": "supabase"
      }
    ]
  },
  "error": null,
  "status": 200
}
```

**Not Found (404):**

```json
{
  "data": null,
  "error": "Product 'invalid-slug' not found",
  "status": 404
}
```

---

### 3. GET /categories — List Categories

**Purpose:** Retrieve all active categories (hierarchy with children).

**Query Parameters:** None

**Example Request:**

```bash
curl "http://localhost:3000/api/categories"
```

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Traditional Wear",
      "slug": "traditional-wear",
      "description": "Indian traditional ethnic clothing...",
      "is_active": true,
      "sort_order": 1,
      "children": [
        {
          "id": "uuid-2",
          "name": "Girls Traditional",
          "slug": "girls-traditional",
          "is_active": true,
          "sort_order": 2,
          "children": []
        },
        {
          "id": "uuid-3",
          "name": "Boys Traditional",
          "slug": "boys-traditional",
          "is_active": true,
          "sort_order": 3,
          "children": []
        }
      ]
    },
    {
      "id": "uuid-4",
      "name": "Frocks & Casual",
      "slug": "frocks-casual",
      "is_active": true,
      "sort_order": 4,
      "children": []
    }
  ],
  "error": null,
  "status": 200
}
```

---

### 4. GET /cart — Get Cart by Session

**Purpose:** Retrieve current shopping cart contents.

**Headers:**

| Header | Type | Example | Notes |
|---|---|---|---|
| `X-Session-ID` | string | `session-abc123` | Guest session ID (required for guests) |
| `Authorization` | string | `Bearer <user-id>` | Optional; if present, overrides session |

**Example Request (Guest):**

```bash
curl -H "X-Session-ID: session-abc123" "http://localhost:3000/api/cart"
```

**Success Response (200):**

```json
{
  "data": {
    "id": "uuid-cart",
    "user_id": null,
    "session_id": "session-abc123",
    "items": [
      {
        "id": "uuid-item",
        "quantity": 2,
        "variant": {
          "id": "uuid-var",
          "sku": "PATTU-GLD-2Y",
          "color": "Gold",
          "size": "2Y",
          "price_override": null,
          "product": {
            "id": "uuid-prod",
            "name": "Pattu Pavadai Set",
            "base_price": 3500,
            "sale_price": 2999
          },
          "primary_image": {
            "public_url": "https://...",
            "is_primary": true
          }
        }
      }
    ],
    "subtotal": 5998,
    "item_count": 2
  },
  "error": null,
  "status": 200
}
```

**Empty Cart (200):**

```json
{
  "data": {
    "id": "uuid-cart",
    "session_id": "session-abc123",
    "items": [],
    "subtotal": 0,
    "item_count": 0
  },
  "error": null,
  "status": 200
}
```

---

### 5. POST /cart — Add Item to Cart

**Purpose:** Add a product variant to cart (or create cart if it doesn't exist).

**Headers:**

| Header | Type | Example |
|---|---|---|
| `X-Session-ID` | string | `session-abc123` |

**Body (JSON):**

```json
{
  "variant_id": "uuid-var",
  "quantity": 2
}
```

**Validation:**

```typescript
{
  variant_id: z.string().uuid(),        // Must be valid UUID
  quantity: z.number().int().min(1).max(99)  // 1-99 items
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/cart" \
  -H "X-Session-ID: session-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 2
  }'
```

**Success Response (200):**

```json
{
  "data": {
    "id": "uuid-cart",
    "session_id": "session-abc123",
    "items": [
      {
        "quantity": 2,
        "variant": { ... }
      }
    ],
    "subtotal": 5998,
    "item_count": 2
  },
  "error": null,
  "status": 200
}
```

**Validation Error (400):**

```json
{
  "data": null,
  "error": "variant_id: Invalid UUID, quantity: Must be between 1 and 99",
  "status": 400
}
```

**Not Found (404):**

```json
{
  "data": null,
  "error": "Product variant 'invalid-uuid' not found",
  "status": 404
}
```

**Insufficient Stock (409):**

```json
{
  "data": null,
  "error": "Insufficient stock for variant PATTU-GLD-2Y. Available: 5, requested: 10",
  "status": 409
}
```

---

### 6. PATCH /cart — Update Cart Item Quantity

**Purpose:** Change quantity of an item in cart.

**Headers:**

| Header | Type | Example |
|---|---|---|
| `X-Session-ID` | string | `session-abc123` |

**Body (JSON):**

```json
{
  "variant_id": "uuid-var",
  "quantity": 5
}
```

**Example Request:**

```bash
curl -X PATCH "http://localhost:3000/api/cart" \
  -H "X-Session-ID: session-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 5
  }'
```

**Success Response (200):**

Same as POST /cart (returns updated cart)

**Not Found (404):**

```json
{
  "data": null,
  "error": "Item not found in cart",
  "status": 404
}
```

---

### 7. DELETE /cart — Remove Item from Cart

**Purpose:** Remove a product variant from cart entirely.

**Headers:**

| Header | Type | Example |
|---|---|---|
| `X-Session-ID` | string | `session-abc123` |

**Body (JSON):**

```json
{
  "variant_id": "uuid-var"
}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/api/cart" \
  -H "X-Session-ID: session-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Success Response (200):**

Same as POST /cart (returns updated cart without the item)

---

### 8. GET /wishlist — Get User's Wishlist

**Purpose:** Retrieve wishlisted products for a user.

**Headers:**

| Header | Type | Example | Notes |
|---|---|---|---|
| `Authorization` | string | `Bearer <user-id>` | User UUID (required) |

**Example Request:**

```bash
curl -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000" \
  "http://localhost:3000/api/wishlist"
```

**Success Response (200):**

```json
{
  "data": {
    "id": "uuid-wishlist",
    "user_id": "uuid-user",
    "items": [
      {
        "id": "uuid-item",
        "product": {
          "id": "uuid-prod",
          "name": "Pattu Pavadai Set",
          "slug": "pattu-pavadai-set",
          "base_price": 3500,
          "sale_price": 2999
        },
        "images": [
          {
            "public_url": "https://...",
            "is_primary": true
          }
        ]
      }
    ]
  },
  "error": null,
  "status": 200
}
```

**Unauthorized (401):**

```json
{
  "data": null,
  "error": "Authorization required",
  "status": 401
}
```

---

### 9. POST /wishlist — Toggle Wishlist Item

**Purpose:** Add product to wishlist (or remove if already there).

**Headers:**

| Header | Type | Example |
|---|---|---|
| `Authorization` | string | `Bearer <user-id>` |

**Body (JSON):**

```json
{
  "product_id": "uuid-prod"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/wishlist" \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

**Success Response (200):**

```json
{
  "data": {
    "action": "added",
    "wishlist": {
      "id": "uuid-wishlist",
      "items": [...]
    }
  },
  "error": null,
  "status": 200
}
```

Or if removing:

```json
{
  "data": {
    "action": "removed",
    "wishlist": {
      "id": "uuid-wishlist",
      "items": [...]
    }
  },
  "error": null,
  "status": 200
}
```

---

### 10. POST /orders — Create Order

**Purpose:** Create a new order from cart items.

**Headers:**

| Header | Type | Example | Notes |
|---|---|---|---|
| `Authorization` | string | `Bearer <user-id>` | User UUID (required) |

**Body (JSON):**

```json
{
  "user_id": "uuid-user",
  "address_id": "uuid-address",
  "items": [
    {
      "variant_id": "uuid-var-1",
      "quantity": 2
    },
    {
      "variant_id": "uuid-var-2",
      "quantity": 1
    }
  ],
  "coupon_code": "SAVE10",
  "notes": "Please gift wrap"
}
```

**Validation:**

```typescript
{
  user_id: z.string().uuid(),
  address_id: z.string().uuid(),
  items: z.array(
    z.object({
      variant_id: z.string().uuid(),
      quantity: z.number().int().min(1).max(99)
    })
  ).min(1),  // At least 1 item
  coupon_code: z.string().toUpperCase().optional(),
  notes: z.string().max(500).optional()
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/orders" \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "address_id": "550e8400-e29b-41d4-a716-446655440001",
    "items": [
      {
        "variant_id": "550e8400-e29b-41d4-a716-446655440002",
        "quantity": 2
      }
    ],
    "coupon_code": "SAVE10"
  }'
```

**Success Response (201):**

```json
{
  "data": {
    "id": "uuid-order",
    "user_id": "uuid-user",
    "address_id": "uuid-address",
    "status": "pending",
    "subtotal": 5998,
    "discount": 600,
    "total": 5398,
    "coupon_id": "uuid-coupon",
    "items": [
      {
        "id": "uuid-item",
        "variant_id": "uuid-var",
        "quantity": 2,
        "product_name_snapshot": "Pattu Pavadai Set",
        "sku_snapshot": "PATTU-GLD-2Y",
        "variant_snapshot": "Gold / 2Y",
        "image_snapshot": "https://..."
      }
    ],
    "created_at": "2026-06-01T10:30:00Z"
  },
  "error": null,
  "status": 201
}
```

**Validation Error (400):**

```json
{
  "data": null,
  "error": "items: At least one item required, coupon_code: Must be 1-50 characters",
  "status": 400
}
```

**User Not Found (404):**

```json
{
  "data": null,
  "error": "User 'uuid-user' not found",
  "status": 404
}
```

**Address Not Found (404):**

```json
{
  "data": null,
  "error": "Address 'uuid-address' not found",
  "status": 404
}
```

**Variant Not Found (404):**

```json
{
  "data": null,
  "error": "Variant 'uuid-var' not found",
  "status": 404
}
```

**Insufficient Stock (409):**

```json
{
  "data": null,
  "error": "Insufficient stock for variant PATTU-GLD-2Y. Available: 3, requested: 5",
  "status": 409
}
```

**Invalid Coupon (400):**

```json
{
  "data": null,
  "error": "Coupon SAVE10 is invalid, expired, or usage limit exceeded",
  "status": 400
}
```

---

## Common Response Patterns

### Success (200, 201)

```json
{
  "data": {...},
  "error": null,
  "status": 200
}
```

### Validation Error (400)

```json
{
  "data": null,
  "error": "field1: error message, field2: another error",
  "status": 400
}
```

### Not Found (404)

```json
{
  "data": null,
  "error": "Resource 'identifier' not found",
  "status": 404
}
```

### Conflict (409)

```json
{
  "data": null,
  "error": "Insufficient stock / Business logic violation",
  "status": 409
}
```

### Server Error (500)

```json
{
  "data": null,
  "error": "Internal server error",
  "status": 500
}
```

---

## Testing Checklist

### Setup
- [ ] Database seeded with `scripts/seed.sql` (4 products, 8 variants)
- [ ] Dev server running: `npm run dev`
- [ ] API accessible at `http://localhost:3000/api`

### Endpoint Tests

#### Products
- [ ] GET `/api/products` — returns 4 items
- [ ] GET `/api/products?limit=2&page=1` — returns 2 items, pagination works
- [ ] GET `/api/products?search=pattu` — FTS search works
- [ ] GET `/api/products?category=girls-traditional` — filter by category works
- [ ] GET `/api/products/pattu-pavadai-set` — product detail returns variants + images
- [ ] GET `/api/products/invalid-slug` — returns 404

#### Categories
- [ ] GET `/api/categories` — returns 4 categories in hierarchy

#### Cart (Guest)
- [ ] POST `/api/cart` with valid session — adds item, returns cart
- [ ] POST `/api/cart` with invalid variant_id — returns 400
- [ ] POST `/api/cart` with quantity > stock — returns 409
- [ ] PATCH `/api/cart` — updates quantity
- [ ] DELETE `/api/cart` — removes item
- [ ] GET `/api/cart` — returns cart contents

#### Wishlist (User)
- [ ] POST `/api/wishlist` — adds product, returns {"action": "added"}
- [ ] POST `/api/wishlist` (same product) — removes, returns {"action": "removed"}
- [ ] GET `/api/wishlist` — returns wishlist items
- [ ] Without Authorization header — returns 401

#### Orders
- [ ] POST `/api/orders` with valid data — creates order, status: "pending"
- [ ] POST `/api/orders` with coupon_code — applies discount
- [ ] POST `/api/orders` with invalid address — returns 404
- [ ] POST `/api/orders` with insufficient stock — returns 409
- [ ] Order inventory is decremented (check database)

---

## Notes for Phase 3+

- **Authentication:** Currently, user endpoints (wishlist, orders) expect `Authorization: Bearer <user-id>`. Phase 3 will integrate Supabase Auth to issue real JWT tokens.
- **Sessions:** Guest cart uses `X-Session-ID` header. Phase 3 will merge guest cart to user cart on login.
- **Transactions:** Orders do not yet use PostgreSQL transactions. Phase 3 will wrap order creation in a transaction to prevent partial writes.
- **RLS Policies:** No Row-Level Security policies active yet. Phase 3 will enforce user isolation via RLS.

---

**API contract documentation complete. All endpoints ready for integration testing.**
