You are working on the MYLINI v2 production codebase.

IMPORTANT:
- Read the existing codebase first before making changes.
- Maintain the existing architecture.
- Do NOT introduce breaking changes.
- Do NOT redesign components unnecessarily.
- Keep the premium luxury feel.
- Do NOT change any backend APIs unless explicitly mentioned.
- Do NOT touch authentication, database logic, repositories, services, or API contracts unless required for the requested feature.
- Maintain responsive behaviour on desktop and mobile.
- Reuse existing design tokens wherever possible.
- After every major change, verify there are no TypeScript errors.

======================================================
TASK
======================================================

This is a UI/UX Polish + Branding Update.

The objective is to make the entire storefront look more premium while aligning it with the official MYLINI brand.

Brand colors are already provided.

Use those colors consistently across the entire storefront.

Do NOT partially implement.

Implement ALL the following.

======================================================
1. BRANDING
======================================================

Replace the current "Mylini" color/logo font with the official logo text and color.

OFFICIAL logo and color will be attached in  mylini-v2\prompts\v2\Barossa.pdf
 
Apply consistently across:

- Navbar
- Footer
- Mobile Drawer
- Checkout
- Login
- Account
- About
- Any other place where logo text appears

Do NOT stretch or distort the logo.

======================================================
2. SEARCH BAR
======================================================

Current placeholder:

Search sarees, pattupavadai, frocks...

Remove the word:

"Sarees"

Replace with children products only.

Example:

Search Pattupavadai, Ethnic Sets, Frocks...

======================================================
3. GLOBAL BRAND COLOR SYSTEM
======================================================

The current brown palette is inconsistent.

Replace it with the official MYLINI palette throughout the storefront.

Apply consistently to:

Navbar

Footer

Buttons

Cards

Inputs

Badges

Borders

Backgrounds

Bottom Navigation

Icons

Hover States

Active States

Links

Checkout

Account

About

Wishlist

Cart

Orders

Newsletter

Forms

Dialogs

Use proper design tokens.

Avoid random hardcoded hex values.

======================================================
4. ABOUT PAGE
======================================================

Current About page uses a dark brown theme.

Redesign using the official MYLINI brand colors.

Requirements:

Luxury appearance

Premium typography

Proper contrast

Consistent spacing

Readable sections

Professional feel

======================================================
5. NEWSLETTER SECTION
======================================================

Replace Email Subscription with WhatsApp.

Current:

Email icon

Enter email

Subscribe

New:

WhatsApp Icon

Heading:

Get Updates on WhatsApp

Subtitle:

Receive new arrivals, offers and festive collections instantly.

Input:

Mobile Number

Button:

Join WhatsApp

Do NOT implement backend integration.

UI only.

Leave TODO comment for future WhatsApp API integration.

======================================================
6. FOOTER LAYOUT
======================================================

Currently:

SHOP

HELP & INFO

are stacked vertically.

Change to:

SHOP              HELP & INFO

Two equal columns on mobile.

Improve spacing.

Maintain responsiveness.

======================================================
7. CHECKOUT VALIDATION
======================================================

PHONE NUMBER

Restrict:

Only numeric

Maximum 10 digits

No alphabets

No symbols

Open numeric keyboard on mobile

Auto remove invalid characters

PIN CODE

Restrict:

Only numbers

Maximum 6 digits

No alphabets

Numeric keyboard

Auto remove invalid characters

Show validation message if invalid.

======================================================
8. ADDRESS AUTO FILL
======================================================

If feasible without affecting architecture:

Integrate Google Places Autocomplete.

When user searches address:

Automatically populate:

Address

City

State

PIN Code

If API isn't configured:

Create clean reusable component.

Leave TODO.

Keep manual entry working.

======================================================
9. MOBILE UI POLISH
======================================================

Improve overall polish.

Review:

Spacing

Margins

Typography

Card padding

Section spacing

Button sizes

Icon alignment

Touch targets

Consistency

Visual hierarchy

Do NOT make pages feel crowded.

======================================================
10. BRAND CONSISTENCY
======================================================

Ensure every storefront page follows one unified design language.

Pages include:

Home

Collections

Product

Cart

Checkout

Wishlist

Orders

Account

Contact

About

Footer

Navbar

No page should use a different color system.

======================================================
11. ADDITIONAL UI POLISH
======================================================

Standardize:

Border Radius

Input Height

Button Height

Card Radius

Shadow System

Icon Sizes

Typography Scale

Section Padding

Container Width

Hover Animation

Transitions

Loading Skeleton colors

Empty States

Improve visual hierarchy.

======================================================
12. ACCESSIBILITY
======================================================

Maintain:

Keyboard navigation

Color contrast

Focus states

ARIA labels

Responsive behaviour

======================================================
13. PERFORMANCE
======================================================

Do NOT:

Increase bundle size unnecessarily.

Add unnecessary libraries.

Duplicate components.

Introduce layout shifts.

======================================================
14. CODE QUALITY
======================================================

Use existing components whenever possible.

Avoid duplicated styles.

Keep code clean.

Remove unused classes.

No inline styles unless absolutely required.

======================================================
15. FINAL VERIFICATION
======================================================

Before finishing:

✔ Run TypeScript check

✔ Ensure no console errors

✔ Ensure no hydration issues

✔ Ensure mobile layout is correct

✔ Ensure desktop layout is correct

✔ Ensure dark/light inconsistencies are removed

✔ Ensure all buttons have consistent styling

✔ Ensure footer is responsive

✔ Ensure checkout validation works

✔ Ensure search placeholder is updated

✔ Ensure WhatsApp section replaces email section

✔ Ensure About page matches brand colors

======================================================
OUTPUT
======================================================

After implementation provide:

1. Files modified

2. Summary of changes

3. Any TODOs left (Google Places API / WhatsApp API)

4. Any recommendations for future UI improvements

Do not stop after partial completion. Complete every item before finishing.