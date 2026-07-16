# MYLINI Performance & Architecture Audit (Production Level)

You are acting as a Principal Software Engineer, Performance Engineer, Database Architect, and UX Performance Specialist.

DO NOT WRITE NEW FEATURES.

Your job is to perform a COMPLETE SYSTEM AUDIT of my ecommerce platform and identify EVERYTHING that can be improved.

I want brutally honest feedback.

Assume this project will eventually have:

- 50,000+ products
- 500+ concurrent users
- 1000+ daily orders
- heavy mobile traffic
- Vercel
- Supabase
- Next.js 16
- React 19
- TypeScript
- Tailwind
- Zustand

Your goal is to make the website feel:

• instant
• buttery smooth
• zero lag
• zero loading feeling
• Shopify-level
• Apple.com level smoothness

========================================================

IMPORTANT

DO NOT simply review the code.

Review EVERYTHING:

- folder structure
- architecture
- rendering
- networking
- caching
- image loading
- state management
- Supabase usage
- React rendering
- Next.js features
- browser performance
- memory usage
- bundle size
- hydration
- animation performance
- API structure
- database structure
- UX responsiveness

Think like a performance engineer.

========================================================

SECTION 1

PROJECT ARCHITECTURE AUDIT

Review

- folder structure
- component organization
- server/client boundaries
- unnecessary client components
- route organization
- provider placement
- layout rendering
- reusable components
- duplicated logic

Tell me:

✓ what is good

✓ what is bad

✓ what should be redesigned

========================================================

SECTION 2

SUPABASE AUDIT

This is the MOST IMPORTANT section.

Audit EVERY database interaction.

Find:

- unnecessary reads

- duplicate reads

- duplicate writes

- repeated fetches

- fetching entire rows

- fetching unnecessary columns

- inefficient joins

- inefficient filters

- N+1 queries

- repeated auth checks

- repeated profile fetches

- unnecessary realtime listeners

- unnecessary RPC calls

- slow indexes

- missing indexes

- table scans

- missing caching

- repeated product requests

- duplicate category requests

- duplicate homepage requests

- duplicate cart requests

- duplicate wishlist requests

- duplicate inventory requests

- duplicate variant requests

- duplicate image requests

Estimate:

Current reads

Current writes

Potential savings

Potential bandwidth reduction

Potential latency reduction

========================================================

SECTION 3

SUPABASE COST OPTIMIZATION

Your mission:

Reduce Supabase reads as much as possible WITHOUT sacrificing freshness.

Recommend:

Server Components

ISR

SSG

Static generation

Route cache

Tag cache

fetch cache

React cache()

unstable_cache()

Edge cache

CDN cache

Browser cache

Memory cache

Image cache

Redis (if needed)

Local cache

Session cache

State cache

Explain where each cache should be used.

========================================================

SECTION 4

DATABASE DESIGN

Review:

Products

Categories

Variants

Images

Inventory

Orders

Wishlist

Cart

Users

Reviews

Coupons

Recommendations

Recently viewed

Search

Collections

Check:

Indexes

Foreign keys

Normalization

Denormalization

Query speed

Scaling

Future scalability

========================================================

SECTION 5

NEXT.JS PERFORMANCE AUDIT

Audit:

Server Components

Client Components

Streaming

Suspense

Dynamic imports

Code splitting

Prefetching

Route groups

Partial prerendering

Metadata generation

Static rendering

Dynamic rendering

Image optimization

Fonts

CSS

Scripts

Hydration

React Compiler compatibility

========================================================

SECTION 6

REACT PERFORMANCE

Find:

unnecessary renders

large contexts

unnecessary state

prop drilling

large components

missing memo

missing useMemo

missing useCallback

missing lazy()

missing Suspense

missing virtualization

expensive calculations

========================================================

SECTION 7

IMAGE PERFORMANCE

Every image should appear instantly.

Audit:

Next Image

Priority

Preload

Lazy loading

Blur placeholders

AVIF

WebP

Responsive sizes

srcset

Image CDN

Image caching

Hover prefetch

Gallery preloading

Product image prefetch

Adjacent image preloading

Mobile swipe image loading

Category image loading

Hero image loading

Recommend improvements for every image.

========================================================

SECTION 8

NETWORK PERFORMANCE

Audit:

API requests

Duplicate requests

Waterfalls

Sequential requests

Parallel fetching

Compression

HTTP cache

Connection reuse

Payload size

Headers

Cookies

JSON size

========================================================

SECTION 9

STATE MANAGEMENT

Audit Zustand.

Find:

duplicate state

derived state

unnecessary persistence

large stores

expensive selectors

rerenders

missing selectors

missing shallow compare

========================================================

SECTION 10

SHOPPING EXPERIENCE

Audit:

Homepage

Category page

Product page

Cart

Wishlist

Checkout

Search

Filters

Sorting

Recommendations

Recently viewed

Everything should feel instant.

Recommend:

prefetching

background loading

optimistic updates

parallel loading

skeletons

predictive loading

========================================================

SECTION 11

MOBILE PERFORMANCE

This is VERY important.

Audit:

scroll smoothness

touch latency

swiping

carousel performance

image loading

memory usage

layout shifts

CLS

FPS

animation smoothness

GPU acceleration

========================================================

SECTION 12

BUNDLE ANALYSIS

Estimate:

largest bundles

unused libraries

duplicate packages

tree shaking

dynamic imports

vendor chunks

route chunks

========================================================

SECTION 13

CORE WEB VITALS

Estimate:

LCP

CLS

FID

INP

TTFB

FCP

Speed Index

Interaction latency

Tell me what will hurt Google rankings.

========================================================

SECTION 14

USER EXPERIENCE

I want users to NEVER feel like the site is loading.

Suggest:

predictive loading

background fetching

hover prefetch

viewport prefetch

route prefetch

speculative prefetch

instant navigation

transition optimization

skeleton timing

loading strategy

========================================================

SECTION 15

SECURITY

Audit:

Supabase policies

RLS

JWT usage

Secrets

API keys

Admin client

Server Actions

Rate limiting

Validation

========================================================

SECTION 16

SCALABILITY

Can this architecture support:

100k products

500 concurrent users

5k daily users

100k monthly users

50 orders/minute

If not,

Explain exactly what will fail first.

========================================================

SECTION 17

FINAL SCORECARD

Score each category out of 10.

Architecture

Database

Supabase usage

Performance

Caching

Images

React

Next.js

UX

SEO

Scalability

Security

Maintainability

========================================================

SECTION 18

ACTION PLAN

Create a roadmap.

Priority 1 (Critical)

Priority 2 (High)

Priority 3 (Medium)

Priority 4 (Nice to Have)

For every issue include:

Problem

Impact

Difficulty

Estimated performance improvement

Estimated Supabase read reduction

Estimated bandwidth reduction

Estimated loading improvement

========================================================

FINAL REQUIREMENTS

Do NOT assume anything.

Create Audit output file 

Verify everything from the actual code.

If something cannot be verified, explicitly say:

"Not enough evidence."

Do not invent issues.

Provide file paths and code references for every finding.

Estimate performance improvements conservatively.

The goal is to achieve:

- Near-zero perceived loading time
- Minimal Supabase reads/writes
- Maximum caching efficiency
- Smooth 60 FPS interactions
- Excellent Core Web Vitals
- Production-ready architecture that can scale for years

Treat this as an enterprise-grade performance audit, not a simple code review.