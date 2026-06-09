# Phase 6 — Product Editor v3 (Shopify Parity)
**Created:** 2026-06-05  
**Status:** Planned — DO NOT EDIT CODE until approved

---

## Screenshot Analysis — What Shopify Has vs What We Have

### Shopify Product Form (from screenshots)

| Shopify Section | Shopify Fields | Our Current State |
|---|---|---|
| **Title** | Product title | ✅ Have |
| **Description** | Rich text (bold, italic, underline, color, align, link, media, table, code view) | ⚠️ Partial — missing underline, text color, link, media embed, table, code |
| **Media** | Large primary + 4 thumbnails + add button, drag-reorder | ⚠️ Partial — URL only, no drag-reorder |
| **Category** | Search + AI suggestions | ⚠️ Partial — dropdown + create new |
| **Product Organization** | Type, Vendor, Collections (multi), Tags | ❌ Missing vendor, type, tags |
| **Status** | Active/Draft/Archived | ✅ Have (+ hidden/scheduled) |
| **Publishing channels** | All channels toggle | ❌ Missing |
| **Variants list** | Table: checkbox, image, name, SKU, price, available, publishing | ⚠️ Partial — missing per-variant image, publishing column |
| **Variant detail page** | Full separate page per variant | ❌ Missing — currently table-only |
| **Variant → Price** | Price + Compare-at + Cost per item + Charge tax | ⚠️ Partial — missing cost per item, charge tax |
| **Variant → Inventory** | Inventory tracked toggle, Qty per location, SKU, Barcode, Sell when OOS | ⚠️ Partial — missing tracked toggle, sell-when-OOS, barcode UI |
| **Variant → Shipping** | Physical product toggle, Weight | ⚠️ Partial — weight on product, not per-variant |

---

## Gap Analysis — What Needs to Be Built

### A. New DB columns (Migration 028)

| Table | New Column | Type | Default | Purpose |
|-------|-----------|------|---------|---------|
| `products` | `vendor` | TEXT | NULL | Brand/supplier name |
| `products` | `product_type` | TEXT | NULL | Internal type (e.g. "Skirt & Top") |
| `products` | `tags` | TEXT[] | '{}' | Multi-value tags (Girls, Frock, etc.) |
| `products` | `charge_tax` | BOOLEAN | TRUE | Tax applicability |
| `product_variants` | `cost_per_item` | NUMERIC(10,2) | NULL | Cost price for margin calc |
| `product_variants` | `compare_at_price` | NUMERIC(10,2) | NULL | Strike-through price (replaces base_price role) |
| `inventory` | `sell_when_out_of_stock` | BOOLEAN | FALSE | Continue selling when OOS |
| `inventory` | `inventory_tracked` | BOOLEAN | TRUE | Whether to track stock |

> Note: `barcode` is already in migration 026.

---

### B. New Page — Variant Detail (`/admin/products/[id]/variants/[variantId]`)

Shopify opens a full separate editing page per variant. We need the same.

**Page sections:**
1. **Header** — Back to product, variant name (size/color), Save button
2. **Options** — Size value (editable text input)
3. **Media** — Variant-specific image (from `product_images.variant_id` — column already exists in DB)
4. **Pricing**
   - Price (price_override)
   - Compare-at price (new `compare_at_price` column)
   - Cost per item (new `cost_per_item` column)
   - Charge tax toggle (from product `charge_tax`)
   - Profit & margin (computed: price - cost, %)
5. **Inventory**
   - Inventory tracked toggle (`inventory_tracked`)
   - SKU (editable)
   - Barcode (editable, `barcode` from migration 026)
   - Sell when out of stock toggle (`sell_when_out_of_stock`)
   - Available quantity (editable, calls existing `PATCH /api/admin/inventory/[variantId]`)
6. **Shipping**
   - Physical product toggle (hardcoded TRUE for now)
   - Weight (grams) — move from product-level to variant-level OR keep on product

**New API routes needed:**
- `PATCH /api/admin/products/[id]/variants/[variantId]` — already exists
- `PATCH /api/admin/inventory/[variantId]` — already exists
- Page only needs to combine calls to existing endpoints

---

### C. New Product Form Fields

#### In Organization card (right column):
- **Vendor** — text input (e.g. "Mylini", "Supplier Name")
- **Product Type** — text input (e.g. "Skirt & Top", "Frock")
- **Tags** — chip/token input (type + Enter to add, × to remove)
  - Stored as `TEXT[]` in products table
  - Pre-suggestions: Girls, Boys, Festive, Casual, Silk, Cotton, Best Seller, New

#### Variants table improvements:
- Make each variant row **clickable** → navigates to `/admin/products/[id]/variants/[variantId]`
- Add **Edit** button (pencil icon) per row instead of delete-only
- Show **Compare-at price** column
- Show **Barcode** column (truncated)
- Keep inline stock edit (already built)

---

### D. UI / Typography Improvements

Shopify's form is visually clearer. Key differences observed:

| Element | Current (MYLINI) | Target (Shopify-parity) |
|---------|-----------------|------------------------|
| Section heading font | `0.8rem` uppercase gray | `0.875rem` medium dark, no uppercase |
| Input border | `border-[#D1D5DB]` (light) | `border-[#D1D5DB]` but `1.5px` thickness |
| Input font size | `0.875rem` | `0.9rem` |
| Label font size | `0.82rem` | `0.875rem` semibold |
| Section card padding | `p-5` | `p-6` |
| Field gap | `gap-1.5` | `gap-2` |
| Section gap | `gap-5` | `gap-5` (ok) |
| Body text | `text-[#111827]` | `text-[#1C1917]` (ok) |

---

### E. Description Editor Improvements

Current: Bold, Italic, Heading, List  
Shopify has: Bold, Italic, **Underline**, **Text Color**, **Align** (left/center/right), **Link**, **Lists (ordered + unordered)**, **Indent**, **Table**, **Code view**

Add to our toolbar:
- Underline (`execCommand('underline')`)
- Ordered list (`execCommand('insertOrderedList')`)
- Link (`execCommand('createLink', prompt('URL'))`)
- Align left/center/right
- Remove all formatting button

---

## Implementation Order

### Step 1 — Migration 028 (DB)
Add: vendor, product_type, tags, charge_tax to products  
Add: cost_per_item, compare_at_price to product_variants  
Add: sell_when_out_of_stock, inventory_tracked to inventory

### Step 2 — Zod Schemas
- `adminProductSchema.ts` → add vendor, product_type, tags, charge_tax
- `adminVariantSchema.ts` → add cost_per_item, compare_at_price  
- `adminInventorySchema.ts` → add sell_when_out_of_stock, inventory_tracked

### Step 3 — Repository + Service updates
- `productRepository.ts` → include new product fields in create/update
- `productRepository.ts` → include new variant fields in createVariant/updateVariant
- `inventoryRepository.ts` → include new inventory fields

### Step 4 — New API route: Variant full update
- `PATCH /api/admin/products/[id]/variants/[variantId]` — already exists, just expand schema

### Step 5 — Variant Detail Page
- `src/app/admin/products/[id]/variants/[variantId]/page.tsx`
- New client component: `VariantEditForm.tsx`

### Step 6 — ProductForm.tsx updates
- Add vendor, product_type, tags fields to Organization card
- Update variants table: make rows clickable, add compare_at_price column, edit button
- Improve description toolbar (underline, ordered list, link, align)
- Typography pass: increase font sizes, border thickness

### Step 7 — TypeScript + Build verification
- `npx tsc --noEmit` → 0 errors
- `npm run build` → passing

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/db/migrations/028_shopify_parity.sql` | CREATE |
| `src/lib/validations/adminProductSchema.ts` | UPDATE |
| `src/lib/repositories/productRepository.ts` | UPDATE |
| `src/lib/repositories/inventoryRepository.ts` | UPDATE |
| `src/lib/services/productService.ts` | UPDATE |
| `src/app/api/admin/products/[id]/variants/[variantId]/route.ts` | CREATE (full PATCH) |
| `src/app/admin/products/[id]/variants/[variantId]/page.tsx` | CREATE |
| `src/components/admin/VariantEditForm.tsx` | CREATE |
| `src/components/admin/ProductForm.tsx` | UPDATE |
| `src/lib/api/admin/products.ts` | UPDATE |

---

## Success Criteria
- [ ] Variant row click → opens variant detail page  
- [ ] Variant detail page: price, compare-at, cost, barcode, SKU, stock, sell-when-OOS all editable  
- [ ] Tags chip input on product form, saved as array  
- [ ] Vendor + Product Type fields visible and saved  
- [ ] Description toolbar has underline, ordered list, link, align  
- [ ] Font sizes and borders noticeably more legible  
- [ ] TypeScript 0 errors  
- [ ] Build passes  
