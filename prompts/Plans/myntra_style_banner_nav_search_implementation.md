# Rollable Banner + Mobile Bottom Nav + Search Bar — Implementation Plan

Three Myntra-inspired additions: (1) a multi-slide, admin-manageable hero banner carousel with Cloudinary storage and a documented recommended size, (2) a mobile bottom nav (Home/Cart/Orders/Profile), (3) a search bar above the banner. Constraint: **do not edit or change any other functionality** — every change below is additive except one explicitly-flagged, behavior-invisible backend swap.

## Research findings that shape this plan

- **The multi-banner backend already exists and is generic.** `homepage_sections` supports many rows per `section_type`; `/api/admin/content/sections` (list/create/reorder) and `/api/admin/content/sections/[id]` (patch/delete) are not banner-specific. The only reason there's currently just one banner is that `admin/content/banner/page.tsx` is hand-written as a single-record editor and `page.tsx` only reads `bannerSections[0]`. No new DB tables, migrations, or API routes are needed for the carousel — this is a UI-layer change on both ends.
- **`admin/content/promo-blocks/page.tsx` is the exact pattern to mirror** — it already does add/edit/delete/reorder/toggle-active for multiple `homepage_sections` rows of one type, using the same `/api/admin/content/sections*` routes. Rewriting the banner admin page to match it (with banner's own fields: `badge_text`, `title`, `subtitle`, `link_text`, `link_url`, `image_url`, plus `metadata.secondary_link_text/url/offer_text`) is a same-shape swap, not new design.
- **`HeroBanner.tsx` currently never renders `image_url` at all** — despite the admin form already having an image upload field, the homepage banner is 100% a CSS gradient; the uploaded image is silently ignored. Making the carousel actually show the uploaded image is core to "rollable banner," not scope creep.
- **CMS image uploads (`/api/admin/upload/cms`) currently go to Supabase Storage, not Cloudinary** — product images already use a clean `storageProvider` abstraction (`src/lib/storage/`) that's Cloudinary-backed (`STORAGE_PROVIDER=cloudinary`, matches `CLAUDE.md`'s documented active provider). The explicit ask is "store the image in cloudinary." **Decision**: swap the shared CMS upload route to use `storageProvider.upload()` instead of Supabase Storage, mirroring `/api/admin/upload/route.ts`'s pattern (`sharp` resize → Cloudinary). This is the one deliberate touch to a file also used by promo-blocks/featured-categories uploads — flagged explicitly here because it's the only place this plan doesn't stay purely additive. It's behavior-invisible from the admin UI (same upload widget, same `{url}` response contract) and only changes where new uploads are stored going forward; existing image URLs already saved keep working unchanged.
- **The desktop Navbar search input is already non-functional** (no state, no handler, no submit target) — it's decorative. The new mobile search bar will be genuinely functional (submits to a new results page) rather than copying that decoration, but this means adding one new page (`/search`), not touching the existing `/shop/[category]` page or the Navbar's own search box.
- **Exactly one existing fixed-bottom element**: the product page's "Added to cart" bar (`bottom-6`). Adding a persistent mobile bottom nav requires nudging it up on mobile only, and adding bottom padding to the storefront `<main>` so page content/Footer isn't hidden behind the new nav — small, necessary, and named explicitly rather than silently touched.

## 1. Rollable banner carousel

**Cloudinary swap** (`src/app/api/admin/upload/cms/route.ts`): replace the Supabase Storage upload with `storageProvider.upload()` (resize via `sharp`, max width 1600px, matching `/api/admin/upload/route.ts`'s pattern minus the thumbnail — CMS images don't need one).

**Admin UI** (`src/app/admin/content/banner/page.tsx`, full rewrite): list-based CRUD mirroring `promo-blocks/page.tsx` — add/edit/delete/reorder(↑↓)/active-toggle, one card per banner slide. Fields: badge text, headline, subheading, primary CTA text/link, secondary CTA text/link, offer badge text (the existing `metadata.*` fields), and the image upload with `aspectHint="Recommended: 1600 × 640 px (landscape)"` (updating the existing hint, which was written for the old fixed single-banner layout, to match the new full-image slide format).

**Frontend carousel** (`src/components/home/HeroBanner.tsx`, reworked to take `sections: HomepageSection[]`): each slide renders its `image_url` as a full-bleed background (`object-cover`) with a dark gradient overlay for text legibility, falling back to today's CSS gradient when a slide has no image. Horizontal snap-scroll + dot indicators (same idiom already used by the product-gallery and offer-strip carousels in this codebase) plus a ~5s auto-advance timer. With only one banner row (today's state), this renders exactly as it does now, sans dots — nothing changes visually until a second slide is added.

`src/app/(storefront)/page.tsx`: pass every active banner section to `<HeroBanner sections={bannerSections} />` instead of just `bannerSections[0]`.

## 2. Mobile bottom nav

New `src/components/layout/MobileBottomNav.tsx` — fixed, `md:hidden`, four tabs: Home, Cart (item-count badge via the existing `useCartStore`), Orders, Profile. Active-route highlighting via `usePathname`. Orders/Profile trigger `openLoginModal()` when logged out instead of navigating and letting those pages bounce back to `/` — mirrors the Navbar's existing `handleUserClick` guard exactly, not a new pattern.

Wired into `(storefront)/layout.tsx`, in the normal render path only (not the maintenance-mode branch). Two small, explicitly-named adjustments to avoid the new nav covering existing content: bottom padding on `<main>` on mobile, and the product page's "Added to cart" bar moves from `bottom-6` to `bottom-[76px] md:bottom-6`.

## 3. Search bar above the banner

New `src/components/home/SearchBar.tsx` — Myntra-style rounded search field, mobile-visible, submits to `/search?q=...`. New `src/app/(storefront)/search/page.tsx` (net-new route, doesn't touch `/shop/[category]`) — mirrors that page's server-component shape (`ProductService.list({ search: q })`, already-supported filter, currently unused by any UI; `ProductCard` grid). Inserted into the homepage between `<Navbar/>` and `<HeroBanner/>` — i.e., visually "on top of the banner" without reordering any other homepage section or touching the Navbar.

## Verification

`npx tsc --noEmit` after each of the three features; `npm run build` at the end. Manual check: with today's single banner row nothing visually changes; adding a second banner via the new admin UI produces a working two-slide carousel; a CMS image upload lands in Cloudinary; the bottom nav doesn't cover the product page's cart-confirmation bar or the footer; `/search?q=saree` returns real results.
