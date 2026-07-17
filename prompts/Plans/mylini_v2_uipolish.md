MYLINI v2 — Storefront UX & Mobile Polish (Production Quality)

You are working on MYLINI v2.

Read AGENTS.md and CLAUDE.md first.

Follow every architecture rule.

Do NOT change architecture.

Do NOT introduce breaking changes.

Do NOT change admin functionality.

Do NOT change database architecture unless explicitly required.

Everything must be production-ready.

This is a UX/UI refinement phase.

The target quality is:

Shopify
Apple Store
Nike
Zara
H&M

The website should feel extremely smooth, premium and mobile-first.

GENERAL REQUIREMENTS

Mobile experience is the highest priority.

Everything should work perfectly on:

360px
375px
390px
412px
tablets
desktop

Maintain the existing MYLINI design language.

Do not redesign.

Only improve.

Every interaction should feel polished.

Avoid toast spam.

Avoid abrupt layout shifts.

Avoid unnecessary page reloads.

1. LOGIN BEFORE PURCHASE

Current behaviour:

User can add products without entering their phone number.

New behaviour:

Whenever a customer performs ANY purchase action:

Add to Cart
Buy Now
Wishlist
Checkout

If user is not authenticated:

Open the existing Phone Login Modal immediately.

After login:

Automatically continue the original action.

Examples:

User presses Add to Cart

↓

Phone modal opens

↓

User enters number

↓

Login succeeds

↓

Product automatically added

↓

Small success animation

↓

Remain on same page

DO NOT ask twice.

DO NOT lose selected:

size
quantity
variant

Use the existing login callback architecture already present.

Do NOT rebuild authentication.

2. LOW STOCK UX

Current behaviour:

"Insufficient stock"

appears as an error toast.

This is poor UX.

Replace with professional ecommerce behaviour.

Implement:

• Quantity selector cannot exceed available stock.

• If stock = 2

Maximum quantity selectable = 2.

• Disable "+" button once maximum reached.

• If user somehow exceeds stock via stale state

Show inline message:

"Only 2 pieces are available."

NOT

"Insufficient stock"

If stock <=5

Show elegant badge:

"Only 3 left"

above Add to Cart.

If stock = 0

Disable Add to Cart

Replace button text with:

Out of Stock

Grey button

No popup.

No toast.

3. SITE SHOULD FEEL INSTANT

The website still feels slow during navigation.

Improve perceived performance.

WITHOUT changing backend architecture.

Improve:

Next.js prefetch

Link prefetching

Product page transitions

Home navigation

Category navigation

Product navigation

Image loading

Image preloading

Skeleton timing

Transition timing

Avoid white flashes.

Avoid blank pages.

Navigation should feel continuous.

Use proper loading skeletons everywhere.

Preload likely next images.

Use Framer Motion only where beneficial.

Animations:

200–300ms

iOS style

No lag.

IMPORTANT

Do NOT introduce heavy JS.

Do NOT hurt Core Web Vitals.

Also investigate why homepage/product/category routes still feel slow and optimize within the current architecture without violating existing project rules. Be careful not to reintroduce the previously documented server bundle or rendering issues.

4. MOBILE FIRST REVIEW

Audit EVERY storefront page.

Fix:

spacing

padding

overflow

button sizes

font scaling

touch targets

safe-area spacing

horizontal scrolling

cropped cards

misaligned icons

Every button must have at least:

44px touch height.

Nothing should overflow.

Nothing should feel cramped.

Everything should feel native.

5. MOBILE & DESKTOP MENU IMPROVEMENTS

Current Mobile Drawer

Add:

My Orders

My Account

Wishlist

Logout

if logged in.

Desktop navigation

Also provide quick access for:

My Orders

My Account

Use clean icons.

Do NOT clutter navbar.

Use existing auth state.

No duplicate links.

6. SAVE ADDRESS

Checkout improvements.

Add checkbox:

☑ Save this address

Default:

Checked

If checked

Store address to user's account.

Next checkout:

Automatically show saved addresses.

Allow:

Select existing

Edit existing

Add new

Default address should be preselected.

Follow ecommerce standards.

Do NOT duplicate addresses.

7. OFFER STRIP MOBILE

Current offer strip

class:

w-full mt-4 px-4 md:px-7 overflow-x-auto scrollbar-none

Improve it.

Requirements:

Horizontal swipe

Momentum scrolling

Snap scrolling

No visible scrollbar

Proper spacing

Cards should never compress.

Each offer card should remain readable.

Feels like Apple Wallet cards.

8. HERO BANNER MOBILE

Current banner is too tall.

Redesign proportions only.

Keep same style.

Target:

Shopify

Nike

Apple

Hero should occupy roughly:

50–65vh

instead of excessive height.

Reduce:

vertical padding

headline spacing

button spacing

Content should appear above the fold.

Image should remain prominent.

Improve typography hierarchy.

Buttons should remain thumb-friendly.

No CLS.

No layout jumps.

EXTRA POLISH

Review entire storefront.

Fix every small UX inconsistency you notice.

Examples:

Loading flickers

Button alignment

Card spacing

Product image transitions

Sticky elements

Cart interactions

Quantity controls

Form spacing

Skeleton consistency

Animation timing

Hover states

Pressed states

Focus states

Disabled states

Empty states

Error states

Everything should feel premium.

PERFORMANCE

Maintain:

TypeScript

0 errors

Production build

No architecture violations

No new console warnings

No hydration issues

No unnecessary re-renders

No duplicated API calls

No memory leaks

No bundle bloat

Do not add unnecessary libraries.