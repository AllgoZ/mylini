# System Status — MYLINI v2
**Last Updated:** 2026-08-01
**Branch:** `feature/storefront-ux-polish-and-coupons` (not yet merged to `main`) — 15 commits ahead, latest `cd77fec`
**Build:** ✅ `npx tsc --noEmit` = 0 errors · `npm run build` = passing
**Database:** ✅ LIVE — `jxazdoawlghbfzdmwwmu.supabase.co` (41 migration files; see numbering caveat below). 32 live products, all currently under the "Girls" category (see Known Live Issues). Categories table just cleaned up this session — see below.
**Admin Platform:** ✅ WORKING — stateless HMAC token auth (optionally overridable via a DB-stored credential row), server-side route protection via `proxy.ts`. Categories, Settings, a Shopify-style multi-slide Banner editor with mobile/desktop dual-image upload + focal-point picker, and a full About Us page editor.
**Storefront API:** ✅ WORKING — real Supabase data, RLS enforced, rate limiting active. `/` is genuinely ISR-cached; `/product/[slug]` and `/shop/[category]` show `ƒ Dynamic` in the build table, which is expected for dynamic-segment routes without `generateStaticParams`, not a caching failure.
**Storefront UX:** Rolling image banner carousel (image-only banners now render clean, no empty badge/CTA clutter when text fields are left blank), mobile bottom nav, product search (`/search`), coupon codes at checkout, an address book, a global ~6% type-scale reduction, and a site-wide background color of `#fff3e6`.
**Checkout/Orders:** ✅ Fixed this session — order totals now genuinely include shipping and tax (previously silently dropped), order-detail/My-Orders pages show real product images (including a fallback for orders placed before the image-snapshot bug was fixed) and the real shipping charge instead of a hardcoded "Free", and the COD confirmation screen no longer says "Total paid" for an unpaid order.
**Email:** ✅ LIVE — Resend order-placed notification to the store owner (or `store_settings.order_notification_email`, once set) on every successful checkout.
**Deployment:** Netlify (mylini-demo.netlify.app) + Vercel (mylini.vercel.app), both auto-deploy from `main` — **this whole branch's work is still not merged**. Merge `feature/storefront-ux-polish-and-coupons` before expecting any of this on either live deployment.

---

## Phase Completion

| Phase | Status | Notes |
|---|---|---|
| Phase 1–6, Opti Phase 1–3 | ✅ Complete | See `handover.md`'s "Previous Sessions" section for the full history |
| Storefront UX & Mobile Polish, Admin Settings, Category Management, Myntra-style homepage | ✅ Complete | See `handover.md` — unchanged this session, still accurate |
| Product-level Featured Category tagging | ✅ Complete | Migration 038 — `products.featured_category_id`. 5 Featured Category CMS rows exist; 0 products currently tagged (data fact, tooling works end-to-end) |
| Real business contact details + responsive banner images | ✅ Complete | Contact page now shows real address/phone/email/hours (business name later corrected to "Mylini Ventures," see below); banner editor gained separate mobile/desktop image uploads with a 3×3 focal-point picker per image and a live dual preview, mirrored into `HeroBanner.tsx`'s `OBJECT_POSITION_CLASS` lookup |
| About Us CMS | ✅ Complete | Migration 039 (`about_page_content`, singleton table) — full admin-editable About Us page: eyebrow/heading/intro, narrative image + two paragraphs, stats row, 4 value cards, CTA. `/admin/about` editor, `/about` storefront page falls back to hardcoded content if the fetch fails |
| Banner overlay-clutter fix | ✅ Fixed | `HeroBanner.tsx`'s badge pill, heading, subtitle, both CTAs, and offer card all previously fell back to default copy via `??` (which only guards `null`/`undefined`, not empty string) — an image-only banner with intentionally blank fields still rendered an empty badge pill and an arrow-only button. Each element now only renders when the admin actually filled it in; the darkening gradient is skipped entirely when there's no text to protect |
| Checkout / order-details bug-fix bundle | ✅ Fixed | See "Checkout/Orders" section below — this was a real audit against 6 client-reported screenshots, 4 fixed, 2 flagged as needing clarification (tax-inclusive policy, delivery-time estimation — neither built, see Known Live Issues) |
| Order-detail/My-Orders image fallback | ✅ Fixed | Orders placed before the image-snapshot fix have `image_snapshot: null` permanently (it's a point-in-time snapshot column) — both order pages now fall back to the variant's *current* product image via `order_items.variant_id`, fixing the display retroactively for every existing order with no data migration needed |
| Site background color | ✅ Complete | `--background` / `--color-canvas` in `globals.css` changed from `#F9F4F1` to `#fff3e6`, sitewide (body + every `bg-canvas` page wrapper). Card/surface colors, `--popover`, and the admin panel's own `#FAFAF9` background were deliberately left untouched |
| Category data cleanup | ✅ Complete (2026-08-01, live DB maintenance, no code change) | See "Category Model" below — 8 stray rows soft-deleted |
| OTP verification | 🟡 Built, not wired | Unchanged — infra complete (migrations 032/033), login UI still phone-only per explicit "keep it simple" decision |
| Payments (Razorpay) | 🔲 Planned | Checkout is COD-only |
| Sanity CMS | 🔲 Planned | Homepage CMS already works via DB-backed `homepage_sections` |
| Tax-inclusive pricing policy | 🔲 Needs clarification | Client said "tax should be inclusive... it could not be calculated at the time of checkout" — ambiguous between "remove the separate Tax line" and "the number itself is wrong." Not touched until clarified |
| Estimated delivery time by pincode | 🔲 Needs clarification | No delivery-time logic (zone table, courier API) exists anywhere in this codebase — this is a new feature, not a bug. Needs a decision on the underlying logic before building |

---

## Database (Live)

| Item | Value |
|---|---|
| Project URL | `jxazdoawlghbfzdmwwmu.supabase.co` |
| Migration files | 41 (000–040) — duplicate "031" numbering caveat still applies, see below |
| Tables | 27 total — `about_page_content` (migration 039) is the one new table since the last count; `orders` gained `shipping_charge`/`tax_amount` columns (migration 040), not a new table |
| Products (live, `deleted_at IS NULL`) | 32, all currently assigned to the "Girls" category, none tagged with a Featured Category — data fact, not a bug (see Known Live Issues) |
| Real categories (live) | Exactly two, both top-level, no children: **Boys**, **Girls** — confirmed clean as of 2026-08-01, see "Category Model" below |
| Featured Category CMS rows | 5 (Girls Traditional, Boys Traditional, Frocks & Casual, Traditional Wear, TRADITIONAL) |
| Banner sections (live) | 2 |
| RPC functions | 10 — the 9 from before, unchanged in count/name except `create_order_transactional` was replaced in place (migration 040) to accept and store `p_shipping`/`p_tax` |
| RLS | Unchanged posture — every user-owned/transactional table has real per-user policies; `about_page_content` follows the `users`/`sessions`/`store_settings` pattern: **no anon/authenticated grant at all**, service-role client only |
| `store_settings` (live values) | `shipping_charge=68`, `free_shipping_threshold=4000`, `tax_rate=5`, `maintenance_mode=false` |

### Category model — read this before touching anything category-related

- **`categories` table = the real, product-filtering gender taxonomy.** Exactly two live rows: Boys, Girls (both top-level; the schema supports parent/child, `/admin/categories` supports building a tree, but keep this flat unless asked again).
- **`homepage_sections` (`section_type = 'featured_category'`) = curated homepage tiles**, optionally linked from products (`products.featured_category_id`, migration 038). A tile only shows on "Shop By Category" if at least one active product actually carries it (`HomepageService.getFeaturedCategoriesInUse()`) — no fallback to the real category tree.
- **2026-08-01 cleanup**: the live `categories` table had accumulated 8 stray rows beyond Boys/Girls — 4 legacy sub-categories (`Girls Traditional`, `Boys Traditional`, `Frocks & Casual`, `Traditional Wear`, all dating back to the original 2026-06-01 seed) that a July 19 migration was supposed to delete but never actually did, plus 4 orphaned verification-script fixtures (`Boys (audit test)`, `Boys audit 1784435206997`, `Traditional Wear (renamed)` ×2) created during that same session's testing and never cleaned up. **Root cause, confirmed via timestamps**: the 4 legacy categories still had 11 products pointing at them via `category_id`, and the category-delete endpoint correctly refuses to delete a non-empty category (by design) — but all 11 of those products had themselves already been archived/soft-deleted (`deleted_at` set) back on 2026-06-07 and 2026-07-19, so they were never actually live/customer-facing; the delete guard only checks non-deleted products, and once confirmed, all 8 stray rows were soft-deleted via the real admin API (`DELETE /api/admin/categories/[id]`), reassigning the 11 archived products' `category_id` first (Girls Traditional → Girls, Boys Traditional → Boys, Cotton Frock Set → Girls, ivory kanna → Boys — the latter two confirmed with the store owner since neither category name implies gender on its own). **Nothing customer-facing was ever broken by this** — it was dead rows/archived products, not a live bug — but it's worth knowing this class of thing can happen (a migration that logs "deleted" without confirming the guard actually let it through) and re-checking `deleted_at`, not just `is_active`, when auditing this table in the future.
- **Header nav** (`Navbar.tsx`) "Girls"/"Boys" links point to `/shop/girls` / `/shop/boys`.
- **`/collections`** (redirects to `/shop/collections`) shows **all** products — `shop/[category]/page.tsx` special-cases that one slug to skip the category filter entirely.

### ⚠️ Known documentation/tooling gaps (carried over, still not fixed)

- **Duplicate migration number 031** — unchanged; still not a reliable ordering key past 030.
- **`supabase/migrations/` gap** — files 026–029 still have no timestamped copy.
- **`database.types.ts` is stale** — still missing `admin_credentials`, `store_settings`, `products.featured_category_id`, `about_page_content`, and `orders.shipping_charge`/`tax_amount` in addition to the pre-existing `otps`/`rate_limits` gap. Every new column/table is accessed via `as any` casts or a manually-extended app-level type (see `src/types/order.ts`'s `Order` type), following the established workaround. Regenerating is still low-urgency (nothing breaks), but the gap keeps growing — worth doing eventually.
- **`/product/[slug]` and `/shop/[category]` still show `ƒ Dynamic`** in the build table — expected for dynamic-segment routes without `generateStaticParams`, not a regression.

---

## Known Live Issues (flagged, not fixed)

1. **Guest cart → user cart merge bug** — unchanged, still open. `CartService.mergeGuestCartToUser` still resolves the user's cart via the anon client, which RLS scopes to guest carts only.
2. **All 32 live products are currently under "Girls"** — none are under "Boys," none have a Featured Category tag set. Verified again as of this session's live-data investigation — not a bug (the category/tag assignment mechanisms all work correctly end-to-end), just the current data. Worth knowing before assuming `/shop/boys` should show anything today.
3. **Tax-inclusive pricing policy** — client feedback: "tax should be inclusive... it could not be calculated at the time of checkout." Genuinely ambiguous between two different asks (remove the separate Tax line vs. the number itself being wrong) — not implemented until clarified. Checkout's tax computation/display is untouched.
4. **Estimated delivery time by pincode** — client asked for this at checkout; no delivery-time logic (zone table, courier API, fixed day count) exists anywhere in the codebase today. New feature, not a bug — needs a decision on the underlying logic before building.
5. **`prompts/log.txt`** — an untracked Vercel build log from an earlier debugging session, left in the working tree, deliberately excluded from every commit — not related to any of this work.

---

## Admin Platform — Live ✅

### Layout & Authentication
Unchanged: stateless HMAC-signed `admin_token` cookie, `src/proxy.ts` server-side gate, `requireAdmin()` per-route, optional `admin_credentials` override row.

### Content → Homepage Banner (`/admin/content/banner`)
Full list CRUD for multiple carousel slides. Each slide now supports a **separate mobile and desktop image upload**, a live dual preview (`BannerPreviewPanel.tsx`), and a 3×3 focal-point picker per image (`mobile_image_position`/`desktop_image_position` in `metadata`, mapped to Tailwind object-position classes via a static lookup table — dynamic class construction doesn't survive Tailwind's production build scanner, learned the hard way earlier this session). Leaving badge/title/subtitle/CTA fields blank on a slide now renders cleanly (image only, no empty UI) instead of showing placeholder-looking empty elements.

### Content → About Us (`/admin/about`) — NEW
Full editor for every section of the storefront `/about` page: eyebrow text, two-line heading, intro paragraph, narrative image + heading + two paragraphs, a 3-stat row, 4 value cards (icon/title/description each), and the closing CTA block (heading, text, two buttons with configurable link targets). Backed by a singleton `about_page_content` table (migration 039) — same pattern as `store_settings`/`admin_credentials`.

### Settings (`/admin/settings`)
Unchanged — shipping charge, free-shipping threshold, tax rate, maintenance mode, store info, credential override.

### Categories (`/admin/categories`)
Unchanged — full CRUD for the real `categories` table. Soft-delete only (`deleted_at`), guarded against deleting a non-empty category or one with sub-categories still attached.

### Product Management
Unchanged this session.

---

## Order Notifications
Unchanged mechanism. `sendOrderPlacedNotification` now receives an `order.total` that actually includes shipping and tax (previously it silently didn't) — no code change needed in the email template itself, it just reads a now-correct number.

---

## Checkout / Orders — Fixed This Session

A client sent 6 screenshots, each with a specific complaint. 4 had a clear, verifiable root cause and are fixed; 2 are genuinely ambiguous business-policy questions and were left untouched (see Known Live Issues #3/#4). Plan: `prompts/Plans/checkout_order_details_fixes.md`.

- **Product image missing in "Items Ordered"** — `ProductRepository.findVariantsByIds()` (used at checkout to build the order-item snapshot) joined `product_images` directly under `product_variants`, whose `variant_id` column is never populated by the admin panel (images are linked via `product_id`). Same root-cause class as an earlier cart-thumbnail bug this session. Fixed the join; **also** added a live fallback (via `order_items.variant_id → product_variants → products → product_images`) to both the order-detail page and the My Orders list, so orders placed *before* this fix also show the correct image retroactively — no data backfill needed.
- **Order total silently excluded shipping and tax** — `orders` had no `shipping_charge`/`tax_amount` columns at all; the server computed `total = subtotal − discount`, dropping shipping/tax entirely even though checkout showed the customer a higher number. Migration 040 adds both columns; `create_order_transactional` (RPC) now accepts and stores them; `OrderService.create()` computes them server-side from `store_settings` (mirroring checkout's own formula, never trusting a client-sent amount — same trust model already used for subtotal). Order-detail page now shows the real shipping charge (still "Free" when it's actually 0) and a Tax line when non-zero, instead of a hardcoded "Free" string. Order-detail page degrades gracefully (`?? 0`) for orders placed before this migration, so it doesn't crash on old data.
- **"Total paid" on a COD order** — COD means nothing has been paid yet; the confirmation screen said "Total paid" regardless. Reworded to "Order Total."
- **Contact page company name** — "Mylini Ethnic Wear Studio" → "Mylini Ventures" per the client.

**Deployment note**: migration 040 changes `create_order_transactional`'s signature — it's confirmed applied to the live database as of this session, so checkout is not currently broken. If this branch is ever rolled back to before migration 040 without also reverting the code, checkout would fail cleanly (no data risk) until the migration is re-applied.

---

## File Inventory (additions/changes only — see `fontend.md` for the full structure)

### New API Routes
- `src/app/api/admin/about/route.ts`

### New Pages
- `src/app/(storefront)/about/page.tsx` + `AboutPageClient.tsx`, `src/app/admin/about/page.tsx`

### New Components
- `src/components/admin/BannerPreviewPanel.tsx`

### New Repositories/Services/Types/Validations
- `src/lib/repositories/aboutRepository.ts`, `src/lib/services/aboutService.ts`, `src/lib/validations/aboutSchema.ts`, `src/types/about.ts`

### New Migrations
- `039_about_page_content.sql` (singleton `about_page_content` table)
- `040_order_shipping_tax.sql` (`orders.shipping_charge`/`tax_amount`, replaces `create_order_transactional`)

### Changed (fix-only, no new files)
- `src/components/home/HeroBanner.tsx` (banner overlay-clutter fix + mobile/desktop dual image support)
- `src/lib/repositories/productRepository.ts` (`findVariantsByIds` image-join fix)
- `src/lib/repositories/orderRepository.ts` (shipping/tax params + image-fallback joins on `findByIdForUser`/`findByUserId`)
- `src/lib/services/orderService.ts` (server-side shipping/tax computation)
- `src/types/order.ts` (extended `Order`/`OrderWithItems` types for the new columns/joins)
- `src/app/(storefront)/checkout/page.tsx` ("Order Total" wording)
- `src/app/(storefront)/orders/[id]/page.tsx` (real shipping/tax display, image fallback)
- `src/app/(storefront)/contact/page.tsx` (business name)
- `src/app/globals.css` (`--background`/`--color-canvas` → `#fff3e6`)

---

## Architecture Compliance

| Rule | Status |
|---|---|
| No Supabase outside repositories | ✅ |
| No business logic in routes | ✅ |
| `SERVICE_ROLE_KEY` only in `admin.ts` | ✅ |
| All inputs Zod-validated | ✅ |
| RLS enabled on every user-owned table | ✅ (unchanged) — `about_page_content` (039) follows the same no-anon/no-authenticated posture as `users`/`sessions`/`store_settings` |
| `.env.local` never committed | ✅ |
| No unrelated files committed | ✅ — `prompts/log.txt` and pre-existing unexplained diffs in these architecture docs excluded from every commit this session until this update |

---

## Not Built Yet

| Feature | Status |
|---|---|
| Guest cart → user cart merge fix | Still open, unchanged |
| Tax-inclusive pricing policy | Needs client clarification, see Known Live Issues |
| Estimated delivery time by pincode | Needs a logic decision, see Known Live Issues |
| OTP wired into login UI | Deferred by choice, unchanged |
| Razorpay payments | Planned, unchanged |
| Sanity CMS | Planned, unchanged |
| Cloudflare R2 image uploads | Planned — Cloudinary active |
| Merge `feature/storefront-ux-polish-and-coupons` into `main` | **Not done** — everything in this document is on the feature branch only |
