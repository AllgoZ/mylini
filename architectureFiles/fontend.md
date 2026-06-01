# Frontend Architecture - MYLINI v2

## Overview
MYLINI v2 is a modern e-commerce platform built with Next.js 16, React 19, TypeScript, and Tailwind CSS. The application implements a component-driven architecture with centralized state management for cart and wishlist functionality.

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
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── favicon.ico
│   ├── about/                   # About page
│   ├── about-us/                # About Us page
│   ├── shop/
│   │   └── [category]/          # Dynamic shop by category
│   ├── product/
│   │   └── [id]/                # Dynamic product detail page
│   ├── collections/             # Collections page
│   ├── cart/                    # Shopping cart page
│   ├── checkout/                # Checkout page
│   ├── contact/                 # Contact page
│   └── wishlist/                # Wishlist page
│
├── components/                  # Reusable React components
│   ├── home/                    # Home page specific components
│   │   ├── HeroBanner.tsx      # Hero section
│   │   ├── CategoryCircles.tsx  # Category navigation
│   │   ├── StorySection.tsx     # Brand story section
│   │   ├── OfferStrip.tsx       # Promotional strip
│   │   └── Testimonials.tsx     # Customer testimonials
│   │
│   ├── layout/                  # Layout components
│   │   ├── Navbar.tsx           # Navigation bar
│   │   ├── Footer.tsx           # Footer component
│   │   └── MobileDrawer.tsx     # Mobile menu drawer
│   │
│   ├── shop/                    # Shop page components
│   │   └── ProductCard.tsx      # Reusable product card
│   │
│   └── ui/                      # Reusable UI components (shadcn)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── accordion.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── tabs.tsx
│       └── sonner.tsx          # Toast notifications
│
├── data/                        # Data files
│   └── mockProducts.ts          # Mock product data for development
│
├── store/                       # Zustand state stores
│   ├── useCartStore.ts          # Shopping cart state
│   └── useWishStore.ts          # Wishlist state
│
└── lib/
    └── utils.ts                 # Utility functions (cn, classname merge)
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

## Pages & Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `app/page.tsx` | Home page with hero, categories, testimonials |
| `/shop/[category]` | `shop/[category]/page.tsx` | Products filtered by category |
| `/product/[id]` | `product/[id]/page.tsx` | Product detail view |
| `/collections` | `collections/page.tsx` | Collections showcase |
| `/cart` | `cart/page.tsx` | Shopping cart |
| `/checkout` | `checkout/page.tsx` | Order checkout |
| `/wishlist` | `wishlist/page.tsx` | Saved favorites |
| `/about` | `about/page.tsx` | About page |
| `/about-us` | `about-us/page.tsx` | About us page |
| `/contact` | `contact/page.tsx` | Contact form |

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

## Future Integration Points

### Backend Integration
- Replace `mockProducts.ts` with API calls
- Implement authentication/login
- Add order management API
- Integrate payment gateway (Stripe, Razorpay, etc.)

### Performance Optimizations
- Image optimization with Next.js Image component
- Code splitting with dynamic imports
- Caching strategies for API calls
- SEO optimization with Next.js metadata

### Features to Consider
- User accounts and authentication
- Product reviews and ratings
- Advanced search and filtering
- Inventory management
- Order tracking
- Email notifications

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
