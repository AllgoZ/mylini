# MYLINI Performance Optimization — Phase 2 (Perceived Performance & Premium UX)

You are continuing development of the MYLINI ecommerce platform.

Previous Phase 1 is COMPLETE.

DO NOT modify anything from Phase 1 unless absolutely necessary.

Current Stack

- Next.js 16
- React 19
- TypeScript
- Supabase
- Zustand
- Tailwind
- Framer Motion
- Cloudinary
- Vercel

====================================================

MISSION

The backend is now optimized.

Your job is to make the website FEEL as fast as possible.

Users should NEVER feel like they are waiting.

The experience should feel comparable to:

- Apple
- Shopify
- Linear
- Vercel
- iOS

Everything should feel immediate.

====================================================

IMPORTANT

DO NOT redesign the UI.

DO NOT change layouts.

DO NOT change colors.

DO NOT change typography.

DO NOT change spacing.

DO NOT add new features.

This phase is ONLY about perceived performance.

====================================================

TASK 1

Predictive Image Loading

Audit every page.

Implement intelligent image loading.

Examples:

Homepage

↓

Preload hero image immediately.

↓

Preload first visible collection images.

↓

Idle preload next section.

Category Page

↓

Load first visible products immediately.

↓

Preload products entering viewport.

↓

Preload images slightly before they become visible.

Product Page

↓

Load current image instantly.

↓

Preload next gallery image.

↓

Preload previous gallery image.

↓

Preload selected variant images.

Wishlist

↓

Preload visible images.

Cart

↓

Instant thumbnail loading.

DO NOT preload everything.

Use intelligent prediction.

====================================================

TASK 2

Smooth Image Transitions

Images should never suddenly appear.

Implement

✓ blur placeholders

✓ fade transition

✓ opacity animation

✓ decode async

✓ loading optimization

No flashing.

No white boxes.

No jumping.

====================================================

TASK 3

Scrolling Performance

Audit every scrollable area.

Homepage

Category page

Product page

Cart

Wishlist

Improve

- FPS
- GPU acceleration
- scroll smoothness
- momentum scrolling

Remove unnecessary re-renders during scroll.

====================================================

TASK 4

Navigation Performance

Users should feel navigation is instant.

Implement

- route prefetch

- intelligent Link prefetch

- hover prefetch

- viewport prefetch

- predictive prefetch

ONLY when beneficial.

Avoid unnecessary bandwidth.

====================================================

TASK 5

Loading Experience

Audit every loading state.

Replace

blank screens

with

high quality skeletons.

Rules

Skeletons must match the final layout exactly.

No layout shift.

No flashing.

No generic gray boxes.

Every page should have meaningful loading UI.

====================================================

TASK 6

Product Gallery

Make gallery feel native.

Requirements

Desktop

- instant image switching

- zero flicker

- adjacent image preload

Mobile

- buttery swipe

- smooth snapping

- zero loading while swiping

- keep nearby images warm

====================================================

TASK 7

Animations

Audit Framer Motion.

Improve

- duration

- easing

- GPU transforms

- animation batching

Remove unnecessary animations.

Keep premium ones.

Everything should feel subtle.

Never distracting.

====================================================

TASK 8

Layout Stability

Eliminate every unnecessary layout shift.

Audit

- images

- fonts

- skeletons

- loading

- drawers

- modals

- product cards

CLS should approach zero.

====================================================

TASK 9

Client Rendering Audit

Find components that unnecessarily re-render.

DO NOT blindly add

React.memo

useMemo

useCallback

Only optimize where profiling or clear reasoning justifies it.

Keep the codebase clean.

====================================================

TASK 10

Memory Optimization

Audit

event listeners

intervals

timeouts

animations

observers

image references

DOM nodes

Ensure nothing leaks.

====================================================

TASK 11

Micro-interactions

Improve perceived quality.

Examples

Buttons

Cards

Wishlist

Cart

Quantity buttons

Drawer

Filters

Search

Use

small scale animations

opacity

spring

transform

Never use heavy animations.

Everything should feel responsive.

====================================================

TASK 12

Image Pipeline Audit

Verify

Cloudinary

Next Image

sizes

srcset

priority

lazy loading

blur

AVIF

WebP

Preconnect

Preload

No duplicated downloads.

====================================================

TASK 13

Browser Optimization

Audit

preconnect

dns-prefetch

resource hints

font loading

script loading

critical CSS

Remove anything unnecessary.

====================================================

TASK 14

Mobile Experience

This is VERY important.

The mobile site should feel like a native app.

Audit

touch latency

scroll

gallery

drawer

filters

cart

wishlist

menus

No lag.

No delayed touch feedback.

====================================================

TASK 15

Bundle Optimization

Without changing functionality

Find

large components

heavy imports

unnecessary JS

unused motion

duplicate code

Use dynamic imports ONLY where beneficial.

Do not over-optimize.

====================================================

DO NOT

❌ change backend

❌ modify database

❌ change RPC

❌ touch checkout logic

❌ touch authentication

❌ modify security

❌ redesign components

====================================================

PERFORMANCE GOALS

Homepage

Feels loaded instantly.

Category

Feels instant while scrolling.

Product Page

Gallery feels native.

Cart

Instant updates.

Wishlist

Instant updates.

Images

Never visibly loading.

Navigation

Feels immediate.

Animations

60 FPS.

Mobile

Feels like iOS.

====================================================

AFTER IMPLEMENTATION

Provide a report.

Use this format.

# Files Changed

...

# Image Improvements

...

# Navigation Improvements

...

# UX Improvements

...

# Mobile Improvements

...

# Animation Improvements

...

# Memory Improvements

...

# Bundle Improvements

...

# Estimated Performance Gains

...

# Risks

...

# Manual Testing Checklist

Homepage

Category

Product

Gallery

Wishlist

Cart

Search

Filters

Drawer

Desktop

Mobile

Slow Network

Low-end Android

====================================================

IMPORTANT

Compile after every major change.

Run TypeScript.

Run production build.

Fix every warning introduced by this phase.

Do not leave TODOs.

Everything must be production-ready.

Do not implement speculative optimizations without evidence that they improve the user experience.