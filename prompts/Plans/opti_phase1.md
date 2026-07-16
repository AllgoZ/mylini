# MYLINI Performance Optimization — Phase 1 (Critical Performance)

You are continuing work on the MYLINI ecommerce platform.

Tech Stack

- Next.js 16
- React 19
- TypeScript
- Supabase
- Zustand
- Vercel
- Tailwind CSS

You have already completed a full architecture audit.

Now implement ONLY the approved Phase 1 optimizations.

DO NOT modify UI or design.

DO NOT change layouts.

DO NOT introduce regressions.

DO NOT change business logic.

Everything must remain visually identical.

Your goal is to improve:

- Supabase performance
- Checkout latency
- Read/write efficiency
- Cache efficiency
- Perceived loading speed

=================================================

BEFORE WRITING CODE

First inspect the existing implementation.

Understand:

- repositories
- services
- API routes
- database RPCs
- Zustand stores
- caching

Do NOT assume anything.

=================================================

TASK 1

Optimize Order Creation

Current audit found:

- sequential inventory validation
- sequential stock decrement
- multiple sequential Supabase calls

Your task:

Replace this with a proper production implementation.

Requirements

✓ Atomic transaction

✓ Single database RPC whenever possible

✓ Prevent race conditions

✓ Rollback on failure

✓ Preserve current business logic

✓ Preserve coupon logic

✓ Preserve inventory validation

✓ Preserve stock logging

✓ No behavior changes

=================================================

TASK 2

Reduce Duplicate Supabase Reads

Find and eliminate duplicate reads.

Specifically inspect:

- checkout page
- cart
- homepage
- wishlist
- auth hydration

If identical data is already available,

DO NOT fetch it again.

Reuse existing state.

=================================================

TASK 3

Homepage Query Optimization

Audit homepage queries.

Merge unnecessary Supabase calls.

Example:

Instead of

Banner

↓

Promo

↓

Featured

↓

Best Seller

↓

New Arrival

see if they can be fetched more efficiently.

Maintain identical output.

=================================================

TASK 4

Cart Optimization

Implement optimistic updates.

Requirements

User clicks

↓

UI updates immediately

↓

Supabase syncs

↓

Rollback on failure

No loading delay should be visible.

=================================================

TASK 5

Wishlist Optimization

Verify wishlist already follows optimistic updates.

Improve only if necessary.

=================================================

TASK 6

Cache Improvements

Implement only safe caching.

Use

- React cache()
- unstable_cache()
- Next.js cache tags
- revalidateTag()
- revalidatePath()

ONLY where appropriate.

Do NOT cache

- cart
- checkout
- user session
- inventory

Cache only

- homepage
- products
- categories
- collections

=================================================

TASK 7

Remove Duplicate Requests

Audit

- auth
- cart
- wishlist
- homepage

Ensure

one request

means

one Supabase call.

=================================================

TASK 8

Image Optimization

Audit every product image.

Ensure

✓ Cloudinary transforms

✓ proper sizes

✓ preload where needed

✓ no unnecessary downloads

Do NOT change appearance.

=================================================

TASK 9

Request Optimization

Find

- duplicate queries
- repeated joins
- unnecessary columns

Reduce payload size.

Use explicit selects.

=================================================

TASK 10

Code Quality

While modifying code

- remove dead logic

- simplify duplicated code

- improve naming

WITHOUT changing behavior.

=================================================

VERY IMPORTANT

Do NOT

❌ redesign architecture

❌ change auth

❌ implement OTP

❌ implement RLS

❌ rewrite frontend

❌ modify admin

Those belong to later phases.

=================================================

PERFORMANCE GOALS

Reduce

- Supabase reads
- Supabase writes
- checkout latency
- duplicate requests

Improve

- perceived speed
- caching
- responsiveness

without changing functionality.

=================================================

AFTER IMPLEMENTATION

Provide a report.

Use this exact format.

# Files Changed

- ...

# Database Changes

- ...

# Performance Improvements

- ...

# Supabase Reads Saved

Estimated

- ...

# Supabase Writes Saved

Estimated

- ...

# Latency Improvement

Estimated

- ...

# Risks

- ...

# Manual Testing Checklist

- checkout

- cart

- wishlist

- homepage

- products

- categories

- mobile

- desktop

- edge cases

=================================================

IMPORTANT

Compile after every major change.

Run TypeScript checks.

Run lint.

Fix every error.

Do not leave TODOs.

Do not leave placeholder code.

Everything must be production-ready.