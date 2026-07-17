# MYLINI Phase 2 — Perceived Performance & Premium UX — Implementation Plan

## Context

`prompts/Plans/opti_phase2.md` asks for the storefront to *feel* instant (Apple/Shopify/Linear-level), without touching backend, checkout, auth, layout, colors, typography, spacing, or adding features. Phase 1 (backend/Supabase optimization) is done and explicitly not to be touched except where "absolutely necessary."

I re-read the current state of every file this phase would touch (several evolved since Phase 1: rebranding to Plus Jakarta Sans, a new "related products" section and "just added" bar on the product page, an `isAuthenticated` prop on `MobileDrawer`, `willChange: transform` already added there). This plan is built against that current state, not stale assumptions.

**Method:** for each of the spec's 15 tasks, I looked for a concrete, already-identifiable gap in the actual code — not a hypothetical one. Several tasks map to the same underlying fix (e.g. Tasks 1, 2, 6, 12 all converge on "images pop in abruptly with no blur/fade and no adjacent preload"). Where I found nothing concretely wrong (e.g. Task 8 CLS — the codebase already uses `aspect-*` + `fill` consistently), I say so and don't invent work, per the spec's own closing line: *"Do not implement speculative optimizations without evidence."*

---

## Work Item A — Shared blur + fade image treatment (Tasks 1, 2, 6, 12, 14)

**Problem (verified):** No image anywhere in the storefront uses `placeholder="blur"` or any fade-in treatment — confirmed across `ProductCard.tsx`, `ProductDetailClient.tsx` (gallery + thumbnails), `cart/page.tsx`, `wishlist/page.tsx`, `page.tsx` (promo blocks), `CategoryCircles.tsx`. Every image just pops in the instant it decodes. This is the single most repeated, concrete ask across Tasks 1/2/6/12.

**Fix:** One new small wrapper, `src/components/ui/FadeImage.tsx`, around `next/image`:
- A shared generic shimmer `blurDataURL` (inline SVG-as-base64, no extra network request — keeps Task 12's "no duplicated downloads" constraint)
- `placeholder="blur"` always on
- `onLoad` toggles an internal `loaded` state that drives a ~300ms opacity transition (fade-in) via className, layered on top of whatever `className` the caller passes (doesn't touch `object-cover`/layout classes)
- Passes through every other prop (`fill`, `sizes`, `priority`, `alt`, `src`) unchanged — drop-in replacement for `<Image>`

Then swap `<Image>` → `<FadeImage>` at each call site listed above. No visual redesign — same images, same sizes, same layout; only the pop-in becomes a blur→fade instead of instant/abrupt. Directly satisfies Task 2's checklist (blur, fade, opacity animation, no flashing/white boxes) and Task 14's "no lag" feel on mobile.

**Not doing:** a Cloudinary-fetched real blur thumbnail (`e_blur` transform) — that's an extra network request per image, which conflicts with Task 12's "no duplicated downloads." The generic shimmer is the right tradeoff here.

## Work Item B — Adjacent gallery image preload (Tasks 1, 6)

**Problem (verified):** `ProductDetailClient.tsx`'s desktop gallery swaps a single `<Image>`'s `src` based on `activeImage` (`:236-243`); nothing warms the next/previous image before the user clicks a thumbnail, so a click can show a flash before the new image decodes.

**Fix:** a small effect in `ProductDetailClient` keyed on `[activeImage, images]` that does a plain `new Image().src = getDetailImageUrl(...)` for the index before and after the current one — a browser-cache warm, not a new render. Zero UI change; the next click just resolves from cache instead of network.

**Not doing:** "preload selected variant images" (Task 1's example) — the gallery doesn't currently switch images by variant selection (all `product.images` are shown regardless of selected size/color), so there's nothing to preload there without inventing new variant-image-switching UI, which would be a new feature. **Not doing:** forcing `priority` on more mobile gallery images — Next treats every `priority` image as an LCP-preload candidate; adding more than the current one risks contending with the actual LCP image's bandwidth, which is a regression risk, not a clear win.

## Work Item C — Cloudinary preconnect (Tasks 12, 13)

**Fix:** add `<link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />` to `src/app/layout.tsx`'s returned JSX (Next's App Router hoists `<link>` tags rendered in the root layout into `<head>` automatically). Lets the browser open the TLS connection to the CDN before the first image request fires. One line, no risk.

**Not doing:** dns-prefetch / critical-CSS work — Tailwind + Next already handle CSS optimization automatically, and there are no other third-party origins in use (no analytics/fonts-CDN beyond Google Fonts, which `next/font` already self-hosts and optimizes).

## Work Item D — Route-level loading skeletons (Tasks 4, 5)

**Problem (verified):** No `loading.tsx` exists anywhere in the app (confirmed via glob). Client-side navigation to `/shop/[category]` or `/product/[slug]` currently has no in-between state — Next just waits for the Server Component to resolve before painting anything new, so navigation can feel like nothing happened for a moment.

**Fix:** add `src/app/(storefront)/shop/[category]/loading.tsx` and `src/app/(storefront)/product/[slug]/loading.tsx`. Next's App Router automatically wraps the route segment in `<Suspense>` with this as the fallback — no other wiring needed. Skeletons are built to match the real layout exactly (same grid columns, same aspect ratios, same header shape) using the same `animate-pulse` block pattern already used in `cart/page.tsx`'s and `account/page.tsx`'s existing loading states — not generic gray boxes, and no layout shift when real content swaps in (same container widths/heights).

**Not doing:** a `loading.tsx` for the home page — it's ISR-cached and typically serves instantly from cache; a skeleton there would mostly just flash on true cold-cache misses, which is rare enough not to be worth the added skeleton-matching-a-complex-multi-section-page effort.

## Work Item E — Passive scroll listener + momentum scrolling (Tasks 3, 14)

**Problem (verified):**
- `Navbar.tsx:25` — `window.addEventListener('scroll', handleScroll)` has no `{ passive: true }`, so the browser can't assume the handler won't call `preventDefault()`, which costs a small amount of scroll responsiveness on every frame. (The `setIsScrolled` state update itself is already safe — React bails out of re-rendering when the boolean value doesn't change, so this is purely about the listener's browser-level cost, not extra renders.)
- `CategoryCircles.tsx`'s horizontal row and the new "You May Also Like" row in `ProductDetailClient.tsx` use `overflow-x-auto` + scroll-snap but don't set `WebkitOverflowScrolling: 'touch'` the way the mobile product gallery already does — inconsistent momentum-scroll feel on iOS Safari.

**Fix:** add `{ passive: true }` to the Navbar listener; add the same `style={{ WebkitOverflowScrolling: 'touch' }}` (plus `overscrollBehaviorX: 'contain'` to stop edge-of-scroll rubber-banding from dragging the whole page) to the two horizontal-scroll containers that are missing it.

**Not doing:** anything to the Testimonials marquee (`animate-marquee`, pure CSS `transform`, already GPU-only) or the cart item's exit `height` animation — the latter is a deliberate layout-collapse-on-remove effect; removing or changing it edges into "redesign" territory the spec explicitly excludes, and there's no clear evidence it's actually janky (it's a single item at a time, not a scroll-driven animation).

## Work Item F — Rendering correctness (Task 9)

**Problem (verified, carried over from the Phase 1 audit, still present):** `ProductDetailClient.tsx:77-79` — `product.images.sort(...)` runs directly in the render body and **mutates the array in place** (`Array.prototype.sort`) on every render. Not just a perf nit — it's a render-purity violation.

**Fix:** wrap in `useMemo(() => [...product.images].sort(...), [product.images])`. This is the one `useMemo` this phase adds, and it's justified by a concrete correctness issue, not speculation — consistent with Task 9's "only optimize where clear reasoning justifies it."

**Not doing:** memoizing `ProductCard`, `selectedVariant` lookup, or anything else — no evidence of an actual re-render problem at current list sizes (~40 items), and the spec explicitly warns against blindly adding `memo`/`useMemo`/`useCallback`.

## Work Item G — Related-products fetch hardening (Task 10)

**Problem (verified):** `ProductDetailClient.tsx`'s related-products `useEffect` (`:33-44`) does a `fetch` with no abort/ignore guard. Fast client-side navigation between two products (e.g. from "You May Also Like") could let a stale response land after the component's `product.id` has already changed, applying the wrong product's related list for a moment.

**Fix:** an `ignore` flag pattern (`let ignore = false; ...; return () => { ignore = true }`) around the existing fetch — a few lines, no change to what's fetched or when, purely a correctness hardening matching Task 10's "audit ... nothing leaks / stale" ask.

## Work Item H — Tap feedback on mobile-only-relevant controls (Tasks 11, 14)

**Problem (verified):** Cart page's quantity +/- buttons and remove button, and the wishlist heart toggle on `ProductCard`, only have `hover:` classes — hover never fires on touch, so tapping these on mobile currently gives zero visual feedback before the state actually updates.

**Fix:** add `active:scale-90` (or the existing `active:scale-95` pattern already used on the mobile sticky Add-to-Cart button) to these specific buttons. Pure CSS `:active` pseudo-class, transform-only (GPU-cheap), no color/spacing/layout change — matches Task 11's "small scale animations... transform... never heavy."

## Work Item I — Dynamic import the size-chart modal (Task 15)

**Problem (verified):** No `next/dynamic` usage exists anywhere in the codebase (confirmed via grep). `ProductDetailClient.tsx`'s size-chart overlay (`:440-471`) is a self-contained block only rendered when `sizeChartOpen` is true (a minority of products even have a `size_chart_url`), never needed for first paint.

**Fix:** extract that block to `src/components/product/SizeChartModal.tsx` (identical markup, just moved) and import it via `next/dynamic(() => import(...), { ssr: false })` in `ProductDetailClient`. Removes it from the initial product-page bundle without changing behavior or appearance at all.

**Not doing:** any broader dynamic-import sweep, and not touching `framer-motion` usage elsewhere — both would be speculative for unmeasured gain and risk the "don't over-optimize" instruction.

---

## Explicitly Not Doing (with reasoning)

| Spec item | Why skipped |
|---|---|
| "Preload hero image" (Task 1) | No raster hero image exists — `HeroBanner.tsx` is a CSS gradient + inline SVG pattern, nothing to preload |
| "Idle preload next section" (Task 1) | Next's built-in lazy-loading (IntersectionObserver-based) already loads below-fold images as they approach viewport — a custom idle-preload layer on top would be speculative/redundant |
| Hover/viewport/predictive Link prefetch (Task 4) | Next's `<Link>` already prefetches automatically in production; every link in the app already uses `next/link`. Adding custom hover-prefetch on top is unjustified extra complexity for cards already covered by viewport-prefetch |
| Framer Motion audit rewrite (Task 7) | Reviewed broadly — animations already animate `transform`/`opacity` (GPU-friendly), springs are already used for drawers/toasts. No concrete jank evidence found; a sweeping rewrite risks changing feel, which is redesign-adjacent |
| CLS audit (Task 8) | Already handled — `aspect-[3/4]` + `fill` used consistently everywhere images render, fonts use `display: swap`. No new layout-shift source found |
| Admin panel | Phase 2's mission (Apple/Shopify/Linear-level feel) is about the customer storefront; admin isn't mentioned in the task list and touching it isn't justified by anything found |

---

## Files Touched

| File | Change |
|---|---|
| `src/components/ui/FadeImage.tsx` (new) | Blur+fade `<Image>` wrapper |
| `src/components/shop/ProductCard.tsx` | Use `FadeImage`; `active:scale` on wishlist heart button |
| `src/app/(storefront)/product/[slug]/ProductDetailClient.tsx` | `FadeImage`; adjacent-image preload effect; `useMemo` sorted images; related-products fetch guard; extract+dynamic-import size chart modal |
| `src/components/product/SizeChartModal.tsx` (new) | Extracted from `ProductDetailClient`, unchanged markup |
| `src/app/(storefront)/cart/page.tsx` | `FadeImage`; `active:scale` on quantity/remove buttons |
| `src/app/(storefront)/wishlist/page.tsx` | `FadeImage` |
| `src/app/(storefront)/page.tsx` | `FadeImage` for promo block images |
| `src/components/home/CategoryCircles.tsx` | `FadeImage`; momentum-scroll CSS |
| `src/components/layout/Navbar.tsx` | `{ passive: true }` on scroll listener |
| `src/app/(storefront)/shop/[category]/loading.tsx` (new) | Skeleton matching grid layout |
| `src/app/(storefront)/product/[slug]/loading.tsx` (new) | Skeleton matching gallery+details layout |
| `src/app/layout.tsx` | Cloudinary `preconnect` link |

## Verification Plan

1. `npx tsc --noEmit` and `npm run build` — must both stay at 0 errors, per the spec's own requirement.
2. Live-server checks (same approach as Phase 1, since no browser automation is available in this environment): fetch home, shop category, product detail, cart, wishlist pages against the existing dev server and confirm 200s with no error text and the new skeleton/image-wrapper markup present.
3. Manual checklist (yours to run in an actual browser, since I can't click-test visually here): product gallery thumbnail switching feels instant on a second click; cart quantity buttons show tap feedback on mobile; navigating cart → a product → back shows a skeleton instead of a blank pause; size chart still opens/closes correctly.
4. Report in the exact format `opti_phase2.md` specifies.
