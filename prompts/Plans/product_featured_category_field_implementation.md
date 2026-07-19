# Product-level Featured Category — Implementation Plan

## The issue

Two rounds of category work landed on: `categories` table = real gender taxonomy (Boys/Girls, what products actually filter by), `homepage_sections` (`featured_category`) = decorative CMS tiles (Girls Traditional, Boys Traditional, Frocks & Casual, Traditional Wear), curated by hand and shown on the homepage regardless of whether any product relates to them. That's the mismatch in the screenshot: the tiles are real-looking category cards but carry zero connection to the catalog, so they can (and did) show even when nothing is tagged with them.

**What's wanted**: Featured Category becomes a real, optional, per-product field — a second, separate selector in the product form below the (unchanged) gender Category field — and the storefront's "Shop By Category" only shows a featured category tile when at least one product actually carries it.

## Design

Reuse the existing Featured Category CMS rows (`homepage_sections`, `section_type = 'featured_category'`) as the *source list* of selectable featured categories — no second category-management UI to build, admins keep using Content → Featured Categories to name/image/curate the options themselves. Link products to one via a new nullable FK column, `products.featured_category_id → homepage_sections.id`. Single-select, nullable — mirrors exactly how the existing gender `category_id` field already works, per "Category" being a single dropdown.

**Why not reintroduce a second category-tree level instead** (i.e. redo the Boys→Traditional/Girls→Traditional hierarchy from two requests ago): the user has now explicitly and consistently separated these into two different concepts across two messages — flat gender category, and a separately-labeled "Featured Category" — and building it as a second FK straight to the existing Featured Category CMS rows is the direct implementation of exactly that, without relitigating the flat-vs-hierarchical category question again.

## Changes

**Migration 038** (additive, nullable, `ON DELETE SET NULL` — never blocks deleting a Featured Category CMS row, it just un-tags any product that referenced it):
```sql
ALTER TABLE products ADD COLUMN featured_category_id UUID REFERENCES homepage_sections(id) ON DELETE SET NULL;
CREATE INDEX idx_products_featured_category_id ON products(featured_category_id);
```
No new grant needed — `anon`/`authenticated`/`service_role` already have table-level grants on `products`; Postgres grants aren't column-scoped, so a new column is covered automatically.

**Validation**: add `featured_category_id: z.string().uuid().nullable().optional()` to `createProductSchema` (`updateProductSchema` is `.partial()` of it, picks this up for free).

**Repository/Service — no changes needed for create/update**: `ProductService.create/update` already pass the validated body straight through to `ProductRepository.create/update`, which do a generic `.insert(data as any)` / `.update({...data} as any)` — once the column exists and the field is in the Zod schema, it flows through with zero repository code touched. `findByIdForAdmin` already selects `*`, so the admin edit form gets it back automatically too.

**New read path** — `HomepageRepository.findFeaturedCategoriesInUse()` / `HomepageService.getFeaturedCategoriesInUse()`: two small queries (distinct `featured_category_id` values from active products, then the matching active `homepage_sections` rows) rather than one complex join — small tables, stays fast. Uses the cookie-free public client (same ISR-safe pattern as the other public homepage reads).

**`CategoryCircles.tsx`**: swap its data source from "all active featured_category rows" to the new "only ones actually in use" query. One-line change; the rest of the component (rendering, the real-category fallback when the list is empty) is untouched.

**`ProductForm.tsx`**: new "Featured Category (optional)" field directly below the existing Category field — a `<select>` with a "None" option plus the active Featured Category CMS rows (fetched from the already-existing `/api/admin/content/sections`, filtered client-side to `section_type === 'featured_category'`, same pattern the Content admin pages already use). Included in the save payload alongside `category_id`.

**Immediate effect on the current 2-product catalog**: neither existing product has a featured category yet, so "Shop By Category" will fall back to showing the real Boys/Girls categories (its existing empty-state behavior) until products are tagged — not a broken/empty section, just a natural consequence of the field being genuinely unset. Left for the user to tag via the new admin field rather than guessed at again.

**Explicitly not doing**: no faceted "filter by featured category" UI on the `/shop/[category]` browse page (not asked for — the ask was tagging + homepage visibility, not a new storefront filter), no multi-select (matches the single-dropdown shape "Category" already has), no gender-scoping of which featured categories are offered for which gender (would need a new field on `homepage_sections` — bigger scope than asked).

## Verification
`npx tsc --noEmit` + `npm run build` after the code changes; live check via the dev server — tag one product with a Featured Category through the admin form, confirm it now appears in "Shop By Category," confirm removing the tag makes it disappear again, confirm the migration needs to be applied manually (per this project's standing rule — no automatic migration runner).
