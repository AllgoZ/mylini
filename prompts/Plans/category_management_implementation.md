# Category Management Fix — Implementation Plan

## Audit: what's actually broken

Two genuinely different systems share the word "category" and the admin only has UI for one of them:

1. **`categories` table** — the real product-catalog hierarchy (`parent_id` self-reference, already exists in the schema, already supports a full tree). This is what `products.category_id` points to and what `/shop/[category]` renders.
2. **`homepage_sections` (`section_type: 'featured_category'`)** — a homepage CMS content block (title/image/link), unrelated to the categories table. Its admin page (`/admin/content/featured-categories`) is correctly grouped under "Content" in the sidebar, next to Homepage Banner and Promo Blocks.

**There is no admin page for #1 at all.** The only two places that touch the real `categories` table are:
- The product form's inline "+ Create new category" quick-add — but it only ever creates a **top-level** category (`handleCreateCategory` calls `adminCreateCategory(name)` with no `parent_id`, even though the client function and the backend (`CategoryService.create(name, parentId)`, `POST /api/admin/categories`) already fully support one).
- The product form's category `<select>` — and this is the second bug: it fetches the full tree then does `cats.flatMap(c => c.children?.length ? c.children : [c])`, which **hides every parent that has children** and shows only leaves. So once any hierarchy exists, the top-level category itself becomes unselectable for a product — only its children are.

That's the whole story behind the report: there's no way to build "Boys → Traditional/Western" because (a) nothing lets you create a sub-category with a parent, and (b) the one dropdown that assigns a product to a category actively hides parent categories once they have children. With no real category tool in sight, "Featured Categories" (Content → CMS tiles) is the only category-labeled thing in the sidebar, so that's what gets used instead — which only ever produces a homepage decoration, not a real catalog category.

**Explicitly not touching**: the storefront `Navbar`'s Boys/Girls links (hardcoded to specific existing slugs, not data-driven — out of scope, not reported as broken), the Featured Categories CMS system itself (it's a legitimate, separate, working feature), and `CategoryCircles.tsx` (already correctly falls back to the real category tree when no CMS tiles exist — once real categories have a proper hierarchy and optional images, that fallback improves for free, no code change needed there).

## Fix

**Backend (additive only — extends `CategoryRepository`/`CategoryService`, doesn't touch `create()` or the existing `POST` handler the product form's quick-add already relies on):**
- `CategoryRepository.findAllForAdmin()` — full tree incl. inactive (admin client, not the public one).
- `CategoryRepository.update(id, patch)`, `.remove(id)` — soft-delete (`deleted_at`, matching the product/variant convention), blocked with a clear error if the category still has children or assigned products (`category_id` is `NOT NULL ... ON DELETE RESTRICT`, so this mirrors a real DB constraint rather than inventing a new rule).
- `src/lib/validations/categorySchema.ts` — `updateCategorySchema`.
- Routes: `GET` added to the existing `/api/admin/categories/route.ts` (its `POST` is untouched); new `/api/admin/categories/[id]/route.ts` (`PATCH`/`DELETE`).
- `src/lib/api/admin/categories.ts`: add `adminListCategories`, `adminUpdateCategory`, `adminDeleteCategory`. `adminCreateCategory` untouched.

**New admin page** `/admin/categories` (+ sidebar entry, main `NAV` not `CONTENT_NAV` — it's catalog data, not homepage decoration): tree view, top-level cards expandable to show children, "+ Add Top-Level Category" and per-category "+ Add Sub-category," edit (name/slug/image via the existing `CmsImageUpload`/active toggle/reorder), delete (blocked with a clear message if not empty). Mirrors the existing promo-blocks/banner admin pages' visual and interaction pattern — no new UI language introduced.

**Product form fix** (`ProductForm.tsx`): replace the flatten-that-hides-parents category list with the full tree rendered as `<select>` options (parent, then its children indented under it) — products become assignable to any level. Add an optional parent picker to the existing "+ Create new category" quick-add, wired through `adminCreateCategory(name, parentId)`, which already accepts it.

**Performance**: every new query is a single small read/write against a small table (categories), mirroring the lightest existing admin patterns (no joins, no N+1) — admin-only surface, zero change to any storefront/public query path, so no risk to the ISR/public performance work from earlier sessions.

## Verification
`npx tsc --noEmit` after each step, `npm run build` at the end, then a live check via the dev server: create "Boys" (top-level) → create "Traditional" under it → confirm the product form's dropdown shows both "Boys" and "— Traditional" as separately assignable, confirm deleting a non-empty category is blocked with a clear message.
