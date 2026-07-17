# Frontend Architecture - MYLINI v2

## Overview
MYLINI v2 is a modern e-commerce platform built with Next.js 16, React 19, TypeScript, and Tailwind CSS. The storefront uses real Supabase APIs — public reads via the anon client (ISR-cached), logged-in-user reads (wishlist, addresses, orders) via a self-signed-JWT authenticated client, all backed by real Row Level Security. The admin platform provides Shopify-style product management and homepage CMS control; admin auth is **stateless HMAC token-based** — no database user or role table required, and route protection is now enforced server-side (`src/proxy.ts`) rather than only client-side. Component-driven architecture with Zustand state management for cart, wishlist, and auth. A store-owner email fires via Resend on every order placed.

**Last Updated:** 2026-07-17 — Opti Phases 1–3 (Performance, Perceived UX, Security) + Phase 6 (UX/mobile polish) + production RLS fix + Resend integration

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **Library** | React | 19.2.4 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **State Management** | Zustand | 5.0.13 |
| **Forms** | React Hook Form | 7.76.0 |
| **Validation** | Zod | 4.4.3 |
| **UI Components** | shadcn/ui, Base UI React | 1.4.1 |
| **Animations** | Framer Motion | 12.38.0 |
| **Notifications** | Sonner | 2.0.7 |
| **Icons** | Lucide React | 1.16.0 |
| **HTML sanitization** | isomorphic-dompurify | 3.18.0 |

## Design System

Warm "coffee & parchment" editorial palette, iOS-style elevation and generous radii, spring/ease motion tuned for a premium feel — not a generic e-commerce look. Defined in `src/app/globals.css` under `@theme`.

### Typography
- **Headings** — Plus Jakarta Sans (`--font-head`) — replaced Playfair Display this session for a cleaner, more e-commerce-appropriate look
- **Body** — Inter (`--font-body`)
- Both loaded via `next/font/google` in `src/app/layout.tsx`

### Color tokens (`src/app/globals.css`)
| Token | Hex | Use |
|---|---|---|
| `--color-clay` / `--color-ink` | `#2B170B` | Headings, primary accents |
| `--color-clay-deep` | `#35200F` | Buttons, active elements |
| `--color-rose-pale` | `#EEDBCD` | Soft accent backgrounds (icon chips, badges) |
| `--color-canvas` | `#F9F4F1` | Page background ("parchment") |
| `--color-surface` / `--color-surface-2` | `#FAF5F2` / `#EEDBCD` | Card and section backgrounds |
| `--color-sage` / `--color-gold` | `#5A6D5D` / `#B89355` | Secondary accents (used sparingly) |
| `--color-text` / `--color-text-mid` / `--color-text-light` | `#35200F` / `#392819` / `#605045` | Text hierarchy |

### Elevation, radius, motion
- **Shadows** — `--shadow-s1`…`--shadow-s5`, iOS-style soft/warm-tinted (`rgba(43, 23, 11, ...)`, not pure black)
- **Radius** — `--radius-xs` (8px) through `--radius-2xl` (36px) — generous, rounded, no sharp corners anywhere in the storefront
- **Easing** — `--ease: cubic-bezier(0.4, 0, 0.2, 1)` (standard), `--spring: cubic-bezier(0.34, 1.56, 0.64, 1)` (bouncy, used sparingly)
- The mobile hamburger drawer specifically moved away from the bouncy spring to an iOS-style tween (`easeOut: [0.32, 0.72, 0, 1]` in, `easeIn: [0.4, 0, 1, 1]` out) this session — the spring read as unpolished for a full-screen overlay.

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (bare, no Navbar/Footer; fonts + Toaster only)
│   ├── globals.css               # Design tokens (@theme) + global styles
│   ├── favicon.ico
│   │
│   ├── (storefront)/             # Route group — customer-facing pages
│   │   ├── layout.tsx            # Storefront layout (Navbar, Footer, AuthProvider, PhoneModal)
│   │   ├── page.tsx              # Home page (ISR revalidate=60)
│   │   ├── shop/[category]/
│   │   │   ├── page.tsx          # Shop by category (ISR)
│   │   │   ├── ProductGridClient.tsx
│   │   │   └── loading.tsx       # Route-level skeleton (Opti Phase 2)
│   │   ├── product/[slug]/
│   │   │   ├── page.tsx          # Product detail (ISR)
│   │   │   ├── ProductDetailClient.tsx
│   │   │   └── loading.tsx       # Route-level skeleton (Opti Phase 2)
│   │   ├── cart/                 # Shopping cart
│   │   ├── checkout/             # Checkout (COD only — Razorpay UI says "UPI & Card coming soon")
│   │   ├── orders/                # Order history + orders/[id] detail (with tracking)
│   │   ├── wishlist/              # Wishlist (now backed by real per-user RLS, not mock)
│   │   ├── account/               # User account
│   │   ├── collections/           # Collections page
│   │   ├── about/, about-us/      # About pages
│   │   └── contact/               # Contact page
│   │
│   ├── admin/                    # Route group — admin platform
│   │   ├── layout.tsx            # Sidebar/topbar shell — auth check now happens in src/proxy.ts, not here
│   │   ├── page.tsx               # Dashboard (metrics, recent orders)
│   │   ├── login/                 # Admin login page
│   │   ├── products/              # List, /new, /[id]/edit, /[id]/variants/[variantId]
│   │   ├── inventory/, orders/, coupons/, customers/
│   │   └── content/                # CMS: banner/, promo-blocks/, featured-categories/
│   │
│   └── api/                      # API routes — see architectureFiles/systemstatus.md for the full, current list
│
├── components/
│   ├── home/                     # HeroBanner, CategoryCircles, PromoBlocks (inline in page.tsx via FadeImage), StorySection, Testimonials, OfferStrip
│   ├── admin/                    # AdminSidebar, AdminTopBar, AdminDrawer, ProductForm, ProductDrawer, VariantEditForm,
│   │                             #   ProductTable(via page), InventoryEditor, CouponDrawer, ImageUploader, CmsImageUpload,
│   │                             #   StatsCard, StatusBadge
│   ├── auth/                     # PhoneModal — single-step phone-only login (OTP UI was built then reverted)
│   ├── providers/                # AuthProvider — hydrates useAuthStore on mount
│   ├── layout/                   # Navbar (passive scroll listener), Footer, MobileDrawer (iOS-ease animation)
│   ├── product/                  # SizeChartModal — extracted for next/dynamic (Opti Phase 2)
│   ├── shop/                     # ProductCard, ProductGridClient (filters: tag, category, price)
│   └── ui/                       # shadcn primitives + FadeImage (blur+fade next/image wrapper, Opti Phase 2)
│
├── store/                        # Zustand state stores
│   ├── useCartStore.ts           # Cart (session + user), optimistic updates (Opti Phase 1)
│   ├── useWishStore.ts           # Wishlist
│   └── useAuthStore.ts           # Auth state — single login(phone) method (phone-only, no OTP step)
│
├── data/
│   └── mockProducts.ts           # ⚠️ Legacy — no longer imported anywhere. Every page is wired to the real API. Safe to delete; left in place, not cleaned up this session (out of scope).
│
└── lib/
    ├── api/                      # Client-side API fetch wrappers
    ├── db/                       # Supabase clients: client.ts (browser), server.ts (anon+cookies), admin.ts (service role), authenticatedClient.ts (JWT-signed, new)
    ├── repositories/, services/, validations/, utils/, integrations/
    └── types/
```

## Key Architectural Patterns

### 1. State Management (Zustand)
- **`useCartStore`** — items, quantities, total; **optimistic updates** since Opti Phase 1 (UI updates immediately on add/quantity-change/remove, before the network round-trip resolves)
- **`useWishStore`** — favorited products, now backed by real per-user data (add/remove hits `/api/wishlist`, RLS-scoped to the logged-in user)
- **`useAuthStore`** — `user`, `isAuthenticated`, `login(phone)`, `logout()`, `hydrate()`, login-modal open state + optional post-login callback (used to resume an action like "add to wishlist" after prompting login)

### 2. Component Organization
- Feature-based grouping (`home/`, `shop/`, `admin/`, `auth/`, `product/`)
- Reusable primitives in `ui/` (shadcn + the custom `FadeImage`)
- Layout chrome (`Navbar`, `Footer`, `MobileDrawer`) in `layout/`

### 3. Routing & Rendering
- Next.js App Router throughout
- **ISR** (`revalidate = 60`) on home, shop/[category], product/[slug] — the biggest performance lever in the app; most visitors are served from cache, not a live DB hit
- Route-level `loading.tsx` on shop and product pages (Opti Phase 2) — replaces a blank flash with an immediate skeleton while the ISR-cached page resolves
- `force-dynamic` on cart/checkout/orders/wishlist/account/contact — these are inherently per-user/session, not cacheable

### 4. Data Management
- **No mock data in the live app** — `src/data/mockProducts.ts` still exists on disk but nothing imports it; every page fetches from the real, RLS-enforced Supabase-backed API
- Product images and CMS assets are served via Cloudinary (`res.cloudinary.com`)

### 5. Forms & Validation
- React Hook Form + Zod, used on Contact, Checkout, and the admin Product form
- All mutation payloads validated against the same Zod schemas the backend uses (`src/lib/validations/`)

### 6. Images
- `next/image` everywhere, `FadeImage` (`src/components/ui/FadeImage.tsx`) wraps it with a blur-up + opacity fade-in transition — used across the homepage, category grids, and product galleries since Opti Phase 2
- AVIF preferred format (`next.config.ts`), Cloudinary preconnect hint in `layout.tsx` for faster first paint

### 7. Animations (Framer Motion)
- `HeroBanner`, `CategoryCircles`, admin sidebar — entrance/interaction animations
- `MobileDrawer` — full-screen overlay, iOS-style tween easing (see Design System above) — deliberately not the bouncy `--spring` token, which read as unpolished at this scale
- Checkout — subtle step-in animations via `motion.div`

## Storefront Pages & Routes

| Route | Component | Purpose | Cache |
|-------|-----------|---------|-------|
| `/` | `page.tsx` | Home — hero, offer strip, category circles, best sellers, promo blocks, new arrivals, girls-traditional row, story, testimonials | revalidate=60 |
| `/shop/[category]` | `ProductGridClient.tsx` | Products with filters (size, price, tag, type) | revalidate=60, `loading.tsx` skeleton |
| `/product/[slug]` | `ProductDetailClient.tsx` | Product detail, gallery, size chart modal, related items | revalidate=60, `loading.tsx` skeleton |
| `/collections` | `collections/page.tsx` | Collections showcase | revalidate=60 |
| `/cart` | `cart/page.tsx` | Cart with instant qty +/- and remove (optimistic) | force-dynamic |
| `/checkout` | `checkout/page.tsx` | Contact info + shipping address + payment (COD only today) | force-dynamic |
| `/orders` | `orders/page.tsx` | Order history (authenticated) | force-dynamic |
| `/orders/[id]` | `orders/[id]/page.tsx` | Order detail, incl. tracking number/URL if set by admin | force-dynamic |
| `/wishlist` | `wishlist/page.tsx` | Saved favorites (authenticated, real per-user data) | force-dynamic |
| `/account` | `account/page.tsx` | User account settings (authenticated) | force-dynamic |
| `/about`, `/about-us` | — | Static-ish content pages | revalidate=3600 |
| `/contact` | `contact/page.tsx` | Contact form | force-dynamic |

## Admin Pages & Routes

| Route | Component | Purpose | Auth |
|-------|-----------|---------|------|
| `/admin/login` | `login/page.tsx` | Admin login (email + password) | Public |
| `/admin` | `page.tsx` | Dashboard (metrics, recent orders) | `proxy.ts` (server-side) + `requireAdmin` |
| `/admin/products` | `products/page.tsx` | Product list (search, filter) | same |
| `/admin/products/new` | `new/page.tsx` | Create product (Shopify-style, pre-save variant/image buffering) | same |
| `/admin/products/[id]/edit` | `edit/page.tsx` | Edit product, live variant/image mgmt | same |
| `/admin/products/[id]/variants/[variantId]` | — | Variant detail/edit | same |
| `/admin/inventory` | `inventory/page.tsx` | Stock management + audit log | same |
| `/admin/orders`, `/admin/orders/[id]` | — | Order list + detail, status/tracking updates | same |
| `/admin/coupons` | `coupons/page.tsx` | Coupon management | same |
| `/admin/customers` | `customers/page.tsx` | Customer list (read-only analytics) | same |
| `/admin/content/banner`, `/promo-blocks`, `/featured-categories` | — | Homepage CMS editors | same |

**Auth note:** admin route protection now happens in **two layers** — `src/proxy.ts` (Next.js 16's renamed middleware) redirects unauthenticated requests to `/admin/login` *before any admin HTML/JS ships*, and `requireAdmin()` still independently verifies the token on every API call. `admin/layout.tsx` no longer does its own client-side auth-check fetch (removed this session — was redundant with `proxy.ts` and added a visible client round-trip).

## Component Hierarchy

```
Layout.tsx (Root — bare)
└── (storefront)/layout.tsx
    ├── AuthProvider (hydrates auth state)
    ├── Navbar (passive scroll listener; wishlist icon, cart icon+count badge, account/login)
    ├── PhoneModal (renders when login is requested; phone-only, single step)
    ├── Page Content (per-route)
    ├── MobileDrawer (hamburger menu — Home/Girls/Boys/Collections/Wishlist/Contact/About + My Orders/My Account when logged in)
    └── Footer
```

## Product Page UX (current)

- **Add to Cart** is the single inline button on the product page — quantity/size selectors above it, price and stock status alongside.
- On success, a small "Added to cart!" confirmation surfaces near the button (`ProductDetailClient.tsx`). There is **no separate mobile sticky Add-to-Cart bar** — it was removed this session per explicit request; the inline button plus confirmation is the only add-to-cart affordance on both mobile and desktop now.
- Size chart opens in a modal, code-split via `next/dynamic` (`SizeChartModal.tsx`) so its bundle only loads when actually opened.
- Adjacent product images preload on mount for a snappier gallery-swipe experience (Opti Phase 2).
- Product description is rendered via `dangerouslySetInnerHTML` after a DOMPurify pass (render-time defense-in-depth; the primary sanitization happens server-side on save).

## State Flow

```
App (Global State via Zustand)
├── useCartStore — items[], quantities, total, optimistic mutations
├── useWishStore — favorited product ids, synced with the authenticated /api/wishlist
└── useAuthStore — user, isAuthenticated, login/logout, login-modal + resume-callback
```

## Known Frontend UX Issue (not fixed, flagged)

Items added to the guest cart can appear to vanish after logging in. The merge-on-login backend call still resolves the user's cart via the anon Supabase client, which real RLS now scopes to guest carts only — so the merge silently writes into an orphaned cart row the storefront never reads back. See `architectureFiles/systemstatus.md` / `FIXES_APPLIED.md` for the full root cause. Frontend impact: don't assume cart contents survive login without testing it after any cart-related change until this is fixed.

## Development Workflow

### Running the Project
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Pages
1. Create folder in `src/app/`
2. Add `page.tsx` (and a `loading.tsx` if the route is ISR/cacheable and a skeleton would help)
3. Follow existing layout patterns — storefront pages sit under `(storefront)/`

### Adding New Components
1. Create in the appropriate feature folder, or `components/ui/` for a generic primitive
2. TypeScript props, no `any` in component signatures
3. Reach for `FadeImage` instead of raw `next/image` for any content image (product photos, CMS blocks) to keep the loading treatment consistent

### Adding New Stores
1. Create in `src/store/`, `create()` from Zustand
2. Export the hook directly — no extra wrapper layer

## Deployment

- **Platform**: Netlify (config in `netlify.toml`)
- **Build**: `npm run build`
- **Output**: `.next/` directory
- Latest work pushed to `origin/main` at commit `6519cb1`

## Completed Integrations

✅ **Real API Integration** — every storefront and admin page wired to live, RLS-enforced Supabase data (no mock data in the live app)
✅ **Phone-Identity Auth** — login/session/middleware working (OTP built, not wired — see below)
✅ **Row Level Security** — real per-user policies on every user-owned table, backed by a self-signed JWT for `authenticated`-role requests
✅ **Shopping Cart** — session-based, optimistic updates; user-merge-on-login has a known bug (see above)
✅ **Wishlist** — real per-user persistence via the authenticated client
✅ **Orders** — atomic RPC-based creation with snapshots, tracking number/URL, order detail page
✅ **Order-placed email** — Resend notification to the store owner on every successful checkout
✅ **Inventory Management** — stock tracking + low-stock alerts
✅ **Admin Platform** — full product/inventory/order/coupon management, server-side route protection
✅ **Homepage CMS** — banner, promo blocks, featured categories
✅ **Performance** — ISR caching, atomic order RPC, optimistic cart, AVIF images
✅ **Perceived UX** — blur/fade images, route-level loading states, preload/prefetch tuning
✅ **Security headers & CSP** — production CSP compatible with ISR, XSS sanitization (DOMPurify), rate limiting

## Remaining Features

| Feature | Status |
|---|---|
| Fix guest cart → user cart merge | Known bug, not yet fixed |
| Wire OTP into login UI | Built, intentionally disconnected — phone-only login by explicit choice |
| Razorpay payments (UPI/Card) | Checkout UI already says "coming soon"; COD is the only live method |
| User reviews & ratings | Not started |
| Sanity CMS | Not started — DB-backed homepage CMS already covers current needs |
| Cloudflare R2 image storage | Not started — Cloudinary is the active provider |
| Customer-facing order confirmation email | Declined for now — current Resend setup uses the sandbox sender (one fixed recipient); needs a verified sending domain first |
| Advanced search | Not started |
| SEO / structured data | Not started |
| Delete unused `src/data/mockProducts.ts` | Cosmetic, safe cleanup, not done (out of scope this session) |

## Best Practices

1. **Component Reusability** — extract repeated patterns into components
2. **Type Safety** — TypeScript interfaces for all props, avoid `any` in new code
3. **State Management** — Zustand for global state, React state for local
4. **CSS** — Tailwind utility classes against the `@theme` tokens in `globals.css`; avoid ad-hoc hex values
5. **Images** — `FadeImage` for content images, `next/image` fundamentals (sizes, priority) still apply
6. **Accessibility** — semantic HTML, ARIA labels, especially in the mobile drawer and modals
7. **Security** — any new `dangerouslySetInnerHTML` usage must go through `sanitizeHtml.ts` first; there is exactly one legitimate use today (product description)

## Notes

- Next.js 16 has real breaking changes from earlier versions/training data — **`middleware.ts` is renamed to `proxy.ts`, the exported function must be named `proxy`**, and it defaults to the Node.js runtime. See `AGENTS.md` and `node_modules/next/dist/docs/` before writing anything routing-related.
- All UI primitives are shadcn/ui-based; `FadeImage` is the one custom primitive layered on top of `next/image`.
- Mobile responsiveness is Tailwind-first; the mobile drawer and bottom-anchored UI (cart confirmation toast) are the main mobile-specific components — there is no separate mobile sticky Add-to-Cart bar (removed this session).
