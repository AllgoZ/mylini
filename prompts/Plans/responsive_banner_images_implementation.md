# Separate Mobile / Desktop Banner Images — Implementation Plan

## Why

The banner currently uses one uploaded image, center-cropped via `object-cover` into two very differently-shaped boxes (portrait on mobile, wide landscape on desktop) — explained in the prior turn. True art-direction (a different image per breakpoint) removes the crop-compromise entirely: each viewport gets an image actually composed for its shape.

## Design — no migration needed

`homepage_sections` already has a flexible `metadata: jsonb` column, and the banner already stores extra fields there (`secondary_link_url`, `secondary_link_text`, `offer_text`) rather than as dedicated top-level columns. The existing `image_url` column becomes explicitly "the desktop/laptop image"; a new `metadata.mobile_image_url` becomes "the mobile image." `updateHomepageSectionSchema`'s `metadata` is already `z.record(z.string(), z.unknown())` — accepts the new key with zero validation changes. No schema migration, no new API route, no new grant — purely a frontend + admin-form change.

**Backward compatible**: if a banner slide has no `mobile_image_url` set (every existing slide today), mobile falls back to the desktop image exactly as it renders now — nothing breaks for banners that only ever get one upload.

## Changes

**`HeroBanner.tsx`**: render two `<Image fill>` elements instead of one — one with `className="md:hidden"` (mobile image, `meta.mobile_image_url ?? imageUrl`), one with `className="hidden md:block"` (desktop image, `imageUrl`). Pure CSS visibility toggling by breakpoint, same pattern already used elsewhere in this app for the mobile-vs-desktop product gallery split — no JS viewport detection, no layout shift, SSR-safe. The gradient-overlay and no-image fallback logic stay exactly as they are.

**Admin banner page** (`admin/content/banner/page.tsx`): the existing "Slide Image" `CmsImageUpload` becomes "Desktop / Laptop Image" (hint: **1920 × 640px, landscape ~3:1** — matches the actual rendered desktop box shape now that it no longer also has to survive a portrait crop). New second `CmsImageUpload` for "Mobile Image (optional)" (hint: **1080 × 1350px, portrait ~4:5**, matching the actual mobile box shape), stored in `form.metadata.mobile_image_url`, with a caption noting it falls back to the desktop image when left empty.

**Explicitly not touched**: the CMS upload route (Cloudinary), the carousel/auto-advance mechanics, the promo-blocks/featured-categories pages, any storefront page other than the banner itself.

## Verification
`npx tsc --noEmit` + `npm run build`; live check — a slide with only a desktop image still renders correctly on both breakpoints (fallback), a slide with both set shows the right image at the right breakpoint.
