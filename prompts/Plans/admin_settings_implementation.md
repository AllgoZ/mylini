# Admin Settings Panel — Implementation Plan

Request: a "Settings" section in the admin sidebar to change the admin username/password, edit shipping charge / tax charge / free-shipping threshold, toggle maintenance mode, edit store information, and "other important functions." Explicit constraint: **do not edit or change any other functionality** — every change here must be additive.

## Architecture facts gathered before writing this plan

- **Admin auth is deliberately stateless** (`AGENTS.md`: "NEVER add back a user_roles or sessions lookup to admin middleware") — login checks `email`/`password` against `process.env.ADMIN_EMAIL`/`ADMIN_PASSWORD`, and critically, **the HMAC token that protects every admin route is signed using `ADMIN_PASSWORD` itself as the signing key** (`signAdminToken(email, adminPassword)` in `/api/admin/auth/login/route.ts`, verified the same way in `adminMiddleware.ts`). This means naively storing an editable password in the DB and using it as the login check would also change the signing key, invalidating the admin's own session token the instant they save the change.
  - **Design decision**: decouple "what credential logs you in" from "what secret signs the session." `ADMIN_PASSWORD`/`ADMIN_EMAIL` env vars keep serving as the token-signing secret and the *default* login credential (so a fresh deployment with no settings row behaves exactly as today — zero forced migration step). A new admin-only table stores an *override* email/password-hash; login checks the override first, falls back to env vars if unset. Changing the password only affects the override table, never the signing secret — no session invalidation surprise.
- **No existing "settings" concept in the schema** — closest precedent is `homepage_sections` (CMS content, admin-write via service-role, public-read). Settings needs the same admin-write shape but a *narrower, explicit* public-read surface, because one of the fields here (a password hash) must never be exposed to any anon/authenticated grant, unlike homepage content.
- **Shipping/tax today**: `shipping = subtotal > 4000 ? 0 : 150` is hardcoded client-side in both `cart/page.tsx` and `checkout/page.tsx`. There is **no tax calculation anywhere** in the codebase currently (only a per-product `charge_tax` boolean that nothing reads). `OrderService.create()`'s stored order `total` is `subtotal - discount` — shipping/tax are **not** part of the authoritative backend total today; they only ever affected the client-side price *display*. To honor "do not change any other functionality," this plan keeps that exact scope: shipping/tax become settings-driven in the same client-side display calculation, and does **not** touch `OrderService.create()` or the order-total backend logic (a pre-existing gap, flagged here, not fixed here — fixing it would change what COD amount gets collected, a materially different and riskier change than what was asked).
- **Maintenance mode has no existing hook anywhere** — needs a new, additive gate. The cleanest, lowest-risk spot is `(storefront)/layout.tsx` (wraps every storefront page, entirely separate from `admin/layout.tsx`, so admin is never affected). It should read via the service-role client (no `cookies()` call), so it doesn't reintroduce the ISR-breaking pattern this session already fixed once.
- **No password-hashing library is a dependency** (no bcrypt/argon2). The codebase already uses `node:crypto`'s `createHmac`/`timingSafeEqual` for the existing admin-token machinery — I'll use `crypto.scrypt` (also built in, no new dependency) for the password hash, with the same timing-safe-compare discipline already established in this file.

## Data model — two new tables (migration `037_store_settings.sql`)

Split into two tables specifically so a public-read grant on one can never accidentally expose the other — defense in depth around the only genuinely sensitive field here:

**`admin_credentials`** — singleton, service-role only (same posture as `users`/`sessions`/`otps`: RLS enabled, zero anon/authenticated grant).
- `admin_email TEXT` (nullable — null means "use `ADMIN_EMAIL` env var")
- `admin_password_hash TEXT` (nullable — null means "use `ADMIN_PASSWORD` env var")
- `updated_at`

**`store_settings`** — singleton, service-role only for writes; reads go through a narrow, explicit public API route (see below), not a Supabase grant, so there's no RLS/grant surface to get wrong here either.
- `shipping_charge NUMERIC NOT NULL DEFAULT 150`
- `free_shipping_threshold NUMERIC NOT NULL DEFAULT 4000`
- `tax_rate NUMERIC NOT NULL DEFAULT 0` (percentage)
- `maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE`
- `maintenance_message TEXT`
- `store_name TEXT NOT NULL DEFAULT 'MYLINI'`
- `store_email TEXT`, `store_phone TEXT`, `store_address TEXT`
- `order_notification_email TEXT` (nullable override of the `ORDER_NOTIFICATION_EMAIL` env var used by the existing Resend integration — the one "other important function" I'm adding beyond the literal request, because it's a natural, already-there integration point and low-risk. Deliberately *not* adding a "disable COD" toggle: COD is the only payment method that exists right now, so a toggle to turn it off would just brick checkout with nothing to fall back to — a footgun, not a useful setting, until Razorpay actually lands.)
- `updated_at`

Both tables singleton-enforced via `CREATE UNIQUE INDEX ... ((true))` (standard Postgres one-row trick). A migration seed inserts the single default row for each.

## Backend

1. `src/types/settings.ts` — `AdminCredentials`, `StoreSettings`, `PublicStoreSettings` (the curated subset safe to expose) types.
2. `src/lib/validations/settingsSchema.ts` — Zod schemas: `updateStoreSettingsSchema` (all the operational fields, partial), `changeAdminCredentialsSchema` (`current_password`, `new_email` optional, `new_password` optional + confirm).
3. `src/lib/repositories/settingsRepository.ts` — service-role client only, mirrors `homepageRepository.ts`'s shape: `getCredentials()`, `getSettings()`, `updateSettings(patch)`, `updateCredentials(patch)`.
4. `src/lib/services/settingsService.ts`:
   - `getPublicSettings()` — returns only the explicit safe subset (`shipping_charge`, `free_shipping_threshold`, `tax_rate`, `maintenance_mode`, `maintenance_message`, `store_name`). Never touches `admin_credentials` at all.
   - `getForAdmin()` — full `store_settings` row for the admin form (never includes the password hash itself, only whether an email override is set).
   - `updateSettings(patch)`.
   - `changeAdminCredentials({ current_password, new_email?, new_password? })` — verifies `current_password` against the *currently effective* credential (override row if set, else env var) using `scrypt` + `timingSafeEqual`, then writes the new email/password-hash. Does **not** touch the token-signing secret (still the env var) — the admin's current session cookie keeps working after the change, no forced re-login.
   - `verifyAdminLogin(email, password)` — used by the login route instead of its inline env-var comparison: checks the override row first, falls back to env vars if the row has nulls. This is the one existing-file touch point (`/api/admin/auth/login/route.ts`), and it's additive-only: identical behavior when no override has ever been set.
5. Routes:
   - `GET /api/settings` (public, no auth) — `SettingsService.getPublicSettings()`. Mirrors `/api/homepage/sections`.
   - `GET /api/admin/settings` + `PATCH /api/admin/settings` (`requireAdmin`) — full settings CRUD for the form.
   - `POST /api/admin/settings/credentials` (`requireAdmin`) — the password/email change endpoint; re-issues a fresh `admin_token` cookie in the response so the admin's own session is seamless (same signing secret as always, just a fresh `exp`).

## Admin UI

6. `AdminSidebar.tsx` — add a `Settings` entry (gear icon) to the existing `NAV` array. One line, no restructuring.
7. `src/app/admin/settings/page.tsx` — single-page form (mirrors the `admin/content/banner` single-record pattern: fetch on mount, controlled form, Save button, toast on success/error), sectioned:
   - **Admin Account** — current password (required to confirm), new email, new password + confirm. Independent "Update Credentials" save action, separate from the section below (changing your login shouldn't be bundled with an accidental settings save).
   - **Shipping & Tax** — shipping charge, free shipping threshold, tax rate.
   - **Store Status** — maintenance mode toggle + message textarea.
   - **Store Information** — store name, email, phone, address, order notification email override.

## Wiring settings into existing behavior (additive, scoped exactly to what already reads these values)

8. `cart/page.tsx` and `checkout/page.tsx`: replace the hardcoded `subtotal > 4000 ? 0 : 150` with a value fetched from `GET /api/settings` on mount (small client fetch, same idiom already used for addresses/coupons), falling back to the current hardcoded defaults if the fetch fails (never break checkout over a settings-fetch hiccup). Add a conditional tax line in checkout's price breakdown (`subtotal * tax_rate / 100`, shown only when `tax_rate > 0`), included in `total`. This only touches the price-summary numbers — no structural change to either page.
9. `(storefront)/layout.tsx`: becomes an async Server Component, checks `SettingsService.getPublicSettings().maintenance_mode` via the service-role client (no `cookies()`, so ISR on child pages is unaffected), renders a simple maintenance page instead of `{children}` when true. Admin is on a separate layout and is never gated.
10. `sendOrderPlacedNotification` call site in `orderService.ts`: if `store_settings.order_notification_email` is set, use it instead of `process.env.ORDER_NOTIFICATION_EMAIL`; otherwise unchanged. One small, additive conditional at the existing call site — not a rewrite of the notification logic.

## Explicitly out of scope (flagged, not silently skipped)

- Backend order-total calculation (shipping/tax not added to the stored `orders.total`) — pre-existing gap, unrelated to this feature, not touched.
- A "disable COD" toggle — no fallback payment method exists yet, would brick checkout.
- Any change to `user_roles`/`sessions`-based admin auth — explicitly forbidden by `AGENTS.md`.

## Verification

`npx tsc --noEmit` after each phase; `npm run build` at the end. Manual check: settings save round-trips correctly, admin session survives a password change, storefront reflects an updated shipping charge, maintenance mode actually blocks the storefront while leaving `/admin` reachable.
