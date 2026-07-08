# Frontend Architecture - MYLINI v2

## Overview
MYLINI v2 is a modern e-commerce platform built with Next.js 16, React 19, TypeScript, and Tailwind CSS. The storefront uses real Supabase APIs (ISR-cached), while the admin platform provides Shopify-style product management and homepage CMS control. Admin auth is **stateless HMAC token-based** — no database user or role table required. Component-driven architecture with Zustand state management for cart, wishlist, and auth.

**Last Updated:** 2026-07-08 — Phase 5.1 (Admin Auth Hardening)

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

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (bare, no Navbar/Footer)
│   ├── globals.css               # Global styles
│   ├── favicon.ico
│   │
│   ├── (storefront)/             # Route group — customer-facing pages
│   │   ├── layout.tsx            # Storefront layout (Navbar, Footer, AuthProvider)
│   │   ├── page.tsx              # Home page (ISR revalidate=60)
│   │   ├── shop/
│   │   │   └── [category]/       # Shop by category (ISR)
│   │   ├── product/
│   │   │   └── [slug]/           # Product detail (ISR)
│   │   ├── cart/                 # Shopping cart
│   │   ├── checkout/             # Checkout + order creation
│   │   ├── orders/               # Order history
│   │   ├── wishlist/             # Wishlist
│   │   ├── account/              # User account
│   │   ├── collections/          # Collections page
│   │   ├── about/                # About page
│   │   ├── about-us/             # About Us page
│   │   └── contact/              # Contact page
│   │
│   ├── admin/                    # Route group — admin platform
│   │   ├── layout.tsx            # Admin layout (sidebar, topbar, auth check)
│   │   ├── page.tsx              # Dashboard (metrics, recent orders)
│   │   ├── login/                # Admin login page
│   │   ├── products/             # Product management
│   │   │   ├── page.tsx          # List (with search/filter)
│   │   │   ├── new/              # Create new product
│   │   │   └── [id]/edit/        # Edit product
│   │   ├── inventory/            # Inventory management
│   │   ├── orders/               # Order management
│   │   ├── coupons/              # Coupon management
│   │   ├── customers/            # Customer list
│   │   └── content/              # CMS content management
│   │       ├── banner/           # Banner section editor
│   │       ├── promo-blocks/     # Promo block editor
│   │       └── featured-categories/  # Featured category editor
│   │
│   └── api/                      # API routes
│       ├── auth/                 # Auth endpoints
│       ├── admin/                # Admin endpoints (protected)
│       ├── products/             # Product endpoints
│       ├── categories/           # Category endpoints
│       ├── cart/                 # Cart endpoints
│       ├── wishlist/             # Wishlist endpoints
│       └── orders/               # Order endpoints
│
├── components/                   # Reusable React components
│   ├── home/                     # Home page components
│   │   ├── HeroBanner.tsx        # Hero section (DB-driven)
│   │   ├── CategoryCircles.tsx   # Category navigation (real API)
│   │   ├── PromoBlocks.tsx       # Promo blocks (CMS-managed)
│   │   ├── StorySection.tsx      # Brand story
│   │   ├── Testimonials.tsx      # Customer testimonials
│   │   └── OfferStrip.tsx        # Promotional strip
│   │
│   ├── admin/                    # Admin components
│   │   ├── AdminSidebar.tsx      # Sidebar navigation
│   │   ├── AdminTopBar.tsx       # Top navigation bar
│   │   ├── ProductForm.tsx       # Full product form (create/edit)
│   │   ├── ProductTable.tsx      # Product list table
│   │   ├── InventoryEditor.tsx   # Stock adjustment UI
│   │   ├── StatusBadge.tsx       # Status display badge
│   │   ├── CmsImageUpload.tsx    # CMS image upload component
│   │   └── ProductDrawer.tsx     # Quick product editor
│   │
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx            # Navigation bar (with cart guard)
│   │   ├── Footer.tsx            # Footer component
│   │   └── MobileDrawer.tsx      # Mobile menu
│   │
│   ├── shop/                     # Shop page components
│   │   ├── ProductCard.tsx       # Reusable product card
│   │   └── ProductGridClient.tsx # Grid with filters (tag, category, price)
│   │
│   └── ui/                       # Reusable UI components (shadcn)
│       ├── button.tsx, card.tsx, input.tsx, etc.
│       └── sonner.tsx            # Toast notifications
│
├── store/                        # Zustand state stores
│   ├── useCartStore.ts           # Shopping cart (session + user)
│   ├── useWishStore.ts           # Wishlist
│   └── useAuthStore.ts           # Auth state (user, session)
│
└── lib/
    ├── api/                      # API client functions
    ├── db/                       # Database clients (server, client, admin)
    ├── repositories/             # Data access layer
    ├── services/                 # Business logic
    ├── validations/              # Zod schemas
    ├── utils/                    # Utilities
    └── types/                    # TypeScript types
```

## Key Architectural Patterns

### 1. **State Management (Zustand)**
- **Cart Store** (`useCartStore.ts`): Manages cart items, quantities, and total
- **Wishlist Store** (`useWishStore.ts`): Manages favorited products
- Both stores are persistent across sessions

### 2. **Component Organization**
- **Feature-based**: Components grouped by feature area (home, shop, layout)
- **UI Components**: Reusable shadcn UI components in `components/ui/`
- **Layout**: Navbar, Footer, and Mobile drawer in `components/layout/`

### 3. **Routing**
- Uses Next.js App Router (not Pages Router)
- Dynamic routes: `/shop/[category]`, `/product/[id]`
- Static pages: About, Collections, Checkout, Contact, etc.

### 4. **Data Management**
- Mock data in `src/data/mockProducts.ts` for development
- Ready to integrate with backend API
- Product data structure includes: id, name, price, category, image, etc.

### 5. **Forms & Validation**
- React Hook Form for form state management
- Zod for schema validation
- Used on Contact page and Checkout

### 6. **Styling**
- Tailwind CSS for utility-first styling
- Custom CSS in `globals.css`
- `tailwind-merge` for dynamic class merging
- `clsx` for conditional styling

### 7. **Animations**
- Framer Motion for smooth transitions and animations
- Implemented in: HeroBanner, CategoryCircles, and other interactive components

## Storefront Pages & Routes

| Route | Component | Purpose | Cache |
|-------|-----------|---------|-------|
| `/` | `page.tsx` | Home page (hero, CMS sections, featured products) | revalidate=60 |
| `/shop/[category]` | `ProductGridClient.tsx` | Products with filters (size, price, tag, type) | revalidate=60 |
| `/product/[slug]` | `ProductDetailClient.tsx` | Product detail + reviews + related items | revalidate=60 |
| `/collections` | `collections/page.tsx` | Collections showcase | revalidate=60 |
| `/cart` | `cart/page.tsx` | Shopping cart with item management | force-dynamic |
| `/checkout` | `checkout/page.tsx` | Order checkout (address + payment) | force-dynamic |
| `/orders` | `orders/page.tsx` | Order history (authenticated) | force-dynamic |
| `/wishlist` | `wishlist/page.tsx` | Saved favorites (authenticated) | force-dynamic |
| `/account` | `account/page.tsx` | User account settings (authenticated) | force-dynamic |
| `/about` | `about/page.tsx` | About page | revalidate=3600 |
| `/about-us` | `about-us/page.tsx` | About us page | revalidate=3600 |
| `/contact` | `contact/page.tsx` | Contact form | force-dynamic |

## Admin Pages & Routes

| Route | Component | Purpose | Auth |
|-------|-----------|---------|------|
| `/admin/login` | `login/page.tsx` | Admin login (email + password) | Public |
| `/admin` | `page.tsx` | Dashboard (metrics, recent orders) | requireAdmin |
| `/admin/products` | `products/page.tsx` | Product list (search, filter, bulk actions) | requireAdmin |
| `/admin/products/new` | `new/page.tsx` | Create new product (Shopify-style form) | requireAdmin |
| `/admin/products/[id]/edit` | `edit/page.tsx` | Edit product (live variant/image mgmt) | requireAdmin |
| `/admin/inventory` | `inventory/page.tsx` | Stock management (adjust + audit log) | requireAdmin |
| `/admin/orders` | `orders/page.tsx` | Order list (status filter) | requireAdmin |
| `/admin/orders/[id]` | `[id]/page.tsx` | Order detail (items + summary) | requireAdmin |
| `/admin/coupons` | `coupons/page.tsx` | Coupon management (create/edit/toggle) | requireAdmin |
| `/admin/customers` | `customers/page.tsx` | Customer list (analytics) | requireAdmin |
| `/admin/content/banner` | `banner/page.tsx` | CMS hero banner editor | requireAdmin |
| `/admin/content/promo-blocks` | `promo-blocks/page.tsx` | CMS promo block editor | requireAdmin |
| `/admin/content/featured-categories` | `featured-categories/page.tsx` | CMS featured category editor | requireAdmin |

## Component Hierarchy

```
Layout.tsx (Root)
├── Navbar
├── MobileDrawer
├── Page Content (Dynamic)
└── Footer
```

## State Flow

```
App (Global State via Zustand)
├── useCartStore
│   ├── items[]
│   ├── quantity
│   └── total
└── useWishStore
    ├── items[]
    └── favorited products
```

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
2. Add `page.tsx` file
3. Follow existing layout patterns

### Adding New Components
1. Create in appropriate folder: `components/home/`, `components/shop/`, or `components/ui/`
2. Use TypeScript for type safety
3. Export from component file

### Adding New Stores
1. Create store file in `src/store/`
2. Use Zustand pattern with `create()` hook
3. Export hook for use in components

## Deployment

- **Platform**: Netlify (config in `netlify.toml`)
- **Build**: `npm run build`
- **Output**: `.next/` directory

## Completed Integrations

✅ **Real API Integration** — All storefront pages wired to live Supabase APIs
✅ **Phone-Identity Auth** — Login/session/middleware working
✅ **Shopping Cart** — Full session-based + user cart support
✅ **Orders** — Complete order creation with snapshots
✅ **Inventory Management** — Stock tracking + low-stock alerts
✅ **Admin Platform** — Full product/inventory/order/coupon management
✅ **Homepage CMS** — Banner, promo blocks, featured categories
✅ **Performance Optimization** — ISR caching (60s), SQL aggregates, optimized queries

## Remaining Features (Phase 3B+)

### Phase 3B (Wishlist Enhancements)
- [ ] Per-user RLS policies (auth safety)
- [ ] Wishlist UI persistence (user wishlists)
- [ ] Cart → user merge on login
- [ ] Wishlist count badge in Navbar
- [ ] `/wishlist` page refinement

### Phase 6+ (Future)
- [ ] User reviews & ratings
- [ ] Email notifications (Resend)
- [ ] Payment gateway (Razorpay)
- [ ] Advanced search
- [ ] Variant grouping on product pages
- [ ] Image storage optimization (R2)
- [ ] SEO/structured data
- [ ] A/B testing framework

## Best Practices

1. **Component Reusability**: Extract repeated patterns into components
2. **Type Safety**: Use TypeScript interfaces for props
3. **State Management**: Use Zustand for global state, React state for local
4. **CSS Organization**: Use Tailwind classes, avoid custom CSS when possible
5. **Performance**: Use Next.js Image for images, implement lazy loading
6. **Accessibility**: Use semantic HTML, proper ARIA labels
7. **Testing**: Write tests for critical flows (cart, checkout)

## Notes

- The project uses Next.js 16 which has breaking changes from earlier versions
- See `AGENTS.md` for Next.js v16 specific breaking changes
- All UI components are from shadcn/ui library
- Mobile responsiveness is built-in with Tailwind CSS
