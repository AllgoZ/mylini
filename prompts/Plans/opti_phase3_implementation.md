# MYLINI Phase 3 — Security, Reliability & Production Readiness — Implementation Plan

## Context

`prompts/Plans/opti_phase3.md` asks for the app to be made secure/reliable/production-ready without new features, UI redesign, or unjustified schema changes. Phase 1 (Supabase/backend perf) and Phase 2 (perceived UX) are both complete and not to be touched except where "absolutely necessary."

This phase directly closes the most serious findings from the original architecture audit (`architectureFiles/audit_results.md`, Section 15): **phone-only login with no possession proof** (anyone can log in as anyone by phone number), **RLS disabled everywhere with blanket `anon` grants** (the public anon key can read/write `users`/`orders`/`addresses`/`coupon_usage` directly, bypassing the app entirely), **no rate limiting anywhere**, and **unsanitized `dangerouslySetInnerHTML`** for product descriptions (confirmed this session: the admin product form's rich-text editor produces HTML with zero sanitization before it's stored and later rendered raw).

**Architectural decision already made with you:** this app has its own custom phone/session auth — it never uses Supabase Auth, so it never has a real `auth.uid()` to key RLS on. You chose **signing custom JWTs** (using `SUPABASE_JWT_SECRET` from your Supabase dashboard) over expanding service-role usage, so real per-user RLS policies using `auth.uid()` work correctly without touching your `SUPABASE_SERVICE_ROLE_KEY`-only-in-`admin.ts` rule for the already-authenticated data paths (cart, wishlist, addresses, orders).

**One narrow, structurally-necessary exception surfaced during research, flagged here explicitly for your approval rather than assumed:** the login/OTP/session-bootstrap path (`AuthService`, `UserRepository`'s phone lookup, `sessionMiddleware`) runs *before* any session exists — there is no user to sign a JWT for yet. Once `users`/`sessions` get real RLS (needed — see Task 3 below, since unrestricted anon SELECT on `sessions` would let anyone holding no credentials at all dump every session token in the table and hijack any logged-in user), *something* needs elevated access to read/write these two tables during login itself. I'm proposing this uses the service-role client too, since it's the same category of "system-level identity bootstrap" operation `admin.ts` already exists for, not a new exception invented for convenience. If you'd rather I find another way (e.g., a table-specific narrow anon policy instead), say so before I implement Task 3 — I'll pause there specifically.

---

## Task 1 + 2 — Production Authentication + OTP

**Problem (verified):** `authService.ts:23-35` — `authenticateByPhone()` creates/logs in a user from a bare phone number with zero possession proof. `loginSchema` only regex-validates 10 digits. This is the account-takeover vector identified in the original audit, live today.

**Fix:**
1. New `otps` table: `id, phone, code_hash, expires_at, attempts, max_attempts, consumed_at, created_at`. Codes are **hashed** before storage (never plaintext — matches "secure storage"), **single-use** (`consumed_at` set on successful verify, checked on every attempt), **5-minute expiry**, **max 5 verify attempts** per code, **60-second resend cooldown** enforced via the new rate-limit utility (Task 5).
2. `SmsProvider` interface (`src/lib/integrations/sms/types.ts`) with one method, `send(phone, message)`. Default implementation: `ConsoleSmsProvider` — logs the OTP server-side only (never returned in any API response), matching `opti_phase3.md`'s own instruction to structure this so a real provider (Twilio/MSG91) can be dropped in later with minimal changes. No SMS provider credentials exist in this project yet, so this phase does not attempt to guess one — the seam is built, wiring a real provider is a follow-up once you have an account.
3. New `OtpService` (`send`, `verify`) + `otpRepository` (follows the existing repository/service layering).
4. `POST /api/auth/otp/send` (phone → rate-limited, cooldown-checked, generates+hashes+stores code, calls `SmsProvider.send`) and `POST /api/auth/otp/verify` (phone + code → checks expiry/attempts/hash match, marks consumed, **then** calls the existing `AuthService.authenticateByPhone` to create the session — this part of the flow is unchanged).
5. `loginSchema`/the login route are replaced by this two-step OTP flow. The phone input UI (`PhoneModal.tsx`) gets a second step for the code — this is new UI *content* (a code input), not a redesign of the modal's look, which the task's "no UX redesign" constraint allows since Task 2 explicitly *requires* OTP to replace phone-only login.

**Session/cookie hardening (Task 1, verified against current code):**
- `api/auth/login` (soon `otp/verify`) already sets `HttpOnly; Secure; SameSite=Strict` — confirmed correct, no change needed.
- **No session rotation on login exists today** — `AuthService.createSession` always mints a fresh 32-byte random token per login (confirmed in `authService.ts:49`), so there's no *stale pre-auth session* to fixate (classic session-fixation requires an attacker-supplied session id from before login to survive login unchanged — that doesn't happen here). Documenting this as **already adequately mitigated**, not adding rotation-on-privilege-change theater on top of it.
- `sessions.expires_at` is enforced (`validateSession` checks `gt('expires_at', now)`), 7-day TTL — reasonable, no change.
- **Logout only deletes the session row it's given** (`AuthService.logout`) — verified correct, single-session logout, not a leak.
- **No expired-session cleanup job exists** — expired rows just accumulate. Not a security issue (expired tokens are already rejected), a minor housekeeping gap — adding a cleanup is out of scope (would be a new scheduled job, not asked for) unless you want it; noting it rather than silently adding infrastructure.
- Admin login (`admin/auth/login/route.ts:32`) — **`password === adminPassword` is not constant-time.** Fixed with `crypto.timingSafeEqual` (buffers padded to equal length first, since `timingSafeEqual` throws on length mismatch and a length-mismatch itself would otherwise leak length information — handled with a length check before the constant-time comparison, which only leaks "the length happens to match," not content).

---

## Task 3 + 4 — Row Level Security + Remove Unsafe Permissions

**New infrastructure:** `src/lib/db/authenticatedClient.ts` — signs a short-lived JWT (`jose`, HS256, `SUPABASE_JWT_SECRET`) with `{ sub: userId, role: 'authenticated', exp: <session's own expiry or a short cap> }` and returns a Supabase client using that JWT as the bearer token instead of the anon key. New env var `SUPABASE_JWT_SECRET` (from your Supabase dashboard → Settings → API → JWT Settings) — added to `env.ts`'s validated set.

**Per-table plan** (every table reviewed; only listing where something changes):

| Table | Anon (public key) | `authenticated` (signed JWT) | Notes |
|---|---|---|---|
| `products`, `product_variants`, `product_images`, `product_attributes`, `categories`, `homepage_sections` | SELECT only (drop the INSERT/UPDATE/DELETE grants migrations 022/025/026/028/029 gave anon) | n/a | Admin already uses `admin.ts` (service role) for all catalog writes — confirmed via `ProductRepository`/`CategoryRepository`/`HomepageRepository`, all called from `requireAdmin()`-wrapped routes. Anon never needs write access here. |
| `inventory`, `inventory_logs` | SELECT only | n/a | Same — admin writes go through `admin.ts`; storefront only ever reads stock. |
| `carts`, `cart_items` | RLS: `USING (user_id IS NULL)` — anon (guest) can only touch **guest** carts, never a logged-in user's | RLS: `USING (auth.uid() = user_id)` | Guest `session_id` is a `crypto.randomUUID()` (122 bits) — already an adequate bearer-token boundary, confirmed in `guestSession.ts`. Splitting the policy this way means anon can never read/write a cart that belongs to a real user, closing the actual gap, without breaking guest checkout. |
| `wishlists`, `wishlist_items` | No grant (always user-scoped, no guest wishlist exists — schema enforces `user_id UNIQUE NOT NULL`) | RLS: `auth.uid() = user_id` (join-based `EXISTS` policy for `wishlist_items`) | Every wishlist route already requires a session (`requireSession`/`validateSessionMiddleware`) — repositories switch to the authenticated client. |
| `addresses` | No grant | RLS: `auth.uid() = user_id` | Same — always session-gated already. |
| `orders`, `order_items` | No grant | RLS: `auth.uid() = user_id` (join-based for `order_items`) | Order **creation** goes through `create_order_transactional` (`SECURITY DEFINER`, Phase 1) — bypasses RLS by design, unaffected. Order **reads** (`findById`/`findByUserId`) switch to the authenticated client, reinforcing the existing app-layer `getByIdForUser` ownership check (Section 1's audit already found this route correctly does `if (order.user_id !== userId) throw 404` — RLS becomes a second, independent layer under it, not a replacement). |
| `coupons` | SELECT only (drop anon write grant) | n/a | Coupon usage recording now happens inside `create_order_transactional` (Phase 1, `SECURITY DEFINER`) — anon never needs to write `coupon_usage` directly; dropping that grant closes a real gap (today anon can `INSERT`/`UPDATE` `coupon_usage`/`coupons` directly per migration 022). |
| `coupon_usage` | No grant | n/a (written only via the `SECURITY DEFINER` RPC) | |
| `users` | **No grant** | **No direct grant either** — all access goes through the service-role identity-bootstrap path (see Context section above, pending your confirmation) | This is the one table where neither anon nor a self-signed JWT works cleanly, for the chicken-and-egg reason explained above. |
| `sessions` | **No grant** | Same as `users` | Currently has zero RLS and implicit full anon access via being un-restricted at the Postgres GRANT level from migration 022 — this is the session-hijacking-via-table-dump risk described above; closing it is one of this task's highest-value fixes. |
| `roles`, `permissions`, `user_roles` | Grants removed entirely (both SELECT and write) | n/a | Confirmed dead schema — Phase 5.1 replaced admin auth with the stateless HMAC token (`AGENTS.md` explicitly forbids re-adding a `user_roles` lookup to admin middleware) and nothing in the current codebase reads these tables for their original purpose. Since they're unused, the correct fix is revoking `anon`'s grant entirely (migration 022 currently gives it `SELECT` on `roles`/`permissions` and full CRUD on `user_roles`) rather than designing RLS for tables nothing legitimate touches. |

**Repositories updated to use the authenticated client** (only where the operation is already known to be for a logged-in user): `cartRepository` (the `user_id`-keyed paths only — guest paths keep the anon client), `wishlistRepository`, `orderRepository` (reads), `UserRepository.createAddress`/address reads. Each of these already receives a validated `userId` from `requireSession`/`validateSessionMiddleware` at the route layer — the JWT is signed from that same already-validated id, not newly trusted input.

**New migration** — `031_rls_and_permissions.sql`: enables RLS on every table above, adds the policies in the table, and revokes/re-grants per the table above. Same dual-file convention as Phase 1 (`src/lib/db/migrations/` + timestamped copy in `supabase/migrations/`), same "I write it, you deploy it via the SQL Editor, I don't run it myself" flow we used for migration 030 — this one is higher-stakes (touches live grants), so I'll wait for your explicit go-ahead before even suggesting how to deploy it, same as last time.

---

## Task 5 — Rate Limiting

**Design:** no Redis/Upstash exists in this stack (verified — not in `package.json`), and adding one means you'd need to create a new external account. Given the app's actual current scale (per the original audit: a handful of seed products, pre-launch) and "do NOT over-engineer," a **Supabase-table-based limiter** is the right-sized choice — reuses existing infra, no new account, and follows the same atomic-RPC pattern already established by `decrement_stock`/`increment_coupon_usage`.

- New `rate_limits` table: `key TEXT PRIMARY KEY, count INT, window_start TIMESTAMPTZ`.
- New RPC `check_rate_limit(p_key text, p_limit int, p_window_seconds int) RETURNS boolean` — atomically increments-or-resets the window and returns whether the caller is still under the limit (`SECURITY DEFINER`, same style as existing RPCs).
- `checkRateLimit(key, limit, windowSeconds)` utility (`src/lib/utils/rateLimit.ts`) wrapping the RPC call, returning `{ allowed, retryAfter }`.
- Applied at: `otp/send` (per-phone: 1/60s cooldown + 5/hour cap), `otp/verify` (per-phone: 5 attempts, already enforced at the OTP-row level per Task 2, but also rate-limited per-IP to slow down phone-number enumeration), `api/orders` POST (per-user), `couponService.validate` call sites (per-user, prevents brute-forcing coupon codes), `wishlist`/`cart` mutation routes (per-session/user, generous limits — these are legitimate high-frequency actions, not auth-sensitive, so limits here are about abuse/DoS prevention, not brute-force prevention), `admin/auth/login` (per-IP, tighter — this guards the single admin password), and admin API routes generally (per-admin-email, generous — internal tooling, just a backstop).

---

## Task 6 — Validation Audit

**Reviewed every schema in `src/lib/validations/`.** Overall assessment: **already solid** — every route checked in this session and in the Phase 1 audit goes through a Zod schema before touching a service, no raw string concatenation into SQL exists anywhere (confirmed again this session — every DB call goes through the Supabase query builder or a parameterized RPC call), numeric fields are typed/bounded, string fields have `.max()` length caps. This task is mostly **confirmation, not rewriting**. Concrete gaps found and fixed:
- `createProductSchema.description` (`adminProductSchema.ts:6`) — currently just `z.string().max(10000)`, no HTML-shape validation. Not a validation gap per se (sanitization is the correct fix, not stricter Zod rules) — covered under Task 7.
- New OTP endpoints get their own schemas (`z.object({ phone: ..., code: z.string().length(6).regex(/^\d+$/) })`).

---

## Task 7 — XSS Protection

**Problem (verified this session, not just carried from the audit):** `ProductForm.tsx`'s inline `RichTextEditor` (line 63) produces HTML, flows through `createProductSchema.description` (a bare length-capped string, no HTML validation) into `products.description`, and is rendered via `dangerouslySetInnerHTML` in `ProductDetailClient.tsx:407` with **zero sanitization anywhere in the pipeline**. This is a real, exploitable stored-XSS path today, not a theoretical one.

**Fix:** add `isomorphic-dompurify` (one library, works both server-side via a `jsdom` fallback and client-side via real `DOMPurify` — avoids needing two different sanitizers with potentially different rule sets).
1. **Save-time (primary):** `ProductService.create`/`update` sanitize `data.description` before it reaches the repository — this is the correct trust boundary (untrusted admin input enters the system here).
2. **Render-time (defense-in-depth):** `ProductDetailClient` sanitizes again immediately before `dangerouslySetInnerHTML` — protects against any data that entered the DB before this fix ships, and against the RLS-bypass-shaped gap in general (belt-and-suspenders here is justified, not theater, because it protects against two *different* threat scenarios — a bug in the save path, and pre-existing/out-of-band data — not the same one twice).

No other `dangerouslySetInnerHTML` usage exists in the codebase (grep-confirmed). Admin form inputs elsewhere are plain text/number fields (no other rich-text fields found).

---

## Task 8 — CSRF Review

**Assessment (documenting, not adding tokens by default):** every mutating cookie (`session`, `admin_token`) is already set `SameSite=Strict` (confirmed in both login routes). `SameSite=Strict` means the cookie is **not sent at all** on cross-site requests, including form submissions and fetches from another origin — this already defeats classic CSRF for every route that relies on these cookies for auth, which is all of them (`requireSession`, `requireAdmin`, `validateSessionMiddleware`). Guest cart mutations (`api/cart`) don't use a cookie-derived identity at all — they take `session_id` from the request body, which isn't a CSRF target in the traditional sense (an attacker's cross-site form can't read the victim's `session_id` to forge a matching request; without SameSite cookie auto-attachment, there's nothing "ambient" for CSRF to exploit here). **Conclusion: no additional CSRF tokens are added — `SameSite=Strict` plus the absence of ambient-cookie-authenticated guest routes already provides adequate protection**, matching the task's own instruction not to add unnecessary tokens where the architecture already covers it.

---

## Task 9 — Security Headers

**Fix:** `next.config.ts`'s `headers()` function (framework-native, no middleware needed — the headers are static per-route, not conditional on request content):
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Frame-Options: DENY` + `Content-Security-Policy: frame-ancestors 'none'` (belt-and-suspenders against clickjacking, both are cheap and each covers browsers that only honor one)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` (this app uses none of these)
- `Content-Security-Policy`: scoped to what's actually in use — `img-src` includes `res.cloudinary.com`, `*.supabase.co`, `images.unsplash.com`, `*.r2.cloudflarestorage.com` (exactly the domains already in `next.config.ts`'s `images.remotePatterns`, nothing broader); `style-src 'self' 'unsafe-inline'` is **required, not optional** — Tailwind/Framer Motion inject inline `style` attributes extensively throughout this codebase, confirmed by grep; `script-src 'self'`; `connect-src 'self' https://*.supabase.co` (Next.js server-side calls don't need this, but keeping it in case any client code ever calls Supabase directly); `object-src 'none'`; `base-uri 'self'`.
- Will verify against the running dev server (checking for CSP console violations on the pages already exercised in Phases 1/2) before calling this done, per "avoid breaking Cloudinary or Next.js."

---

## Task 10 — Error Handling

**Assessment:** `apiResponse.ts`'s `errorResponse()` (reviewed again this session) already does the right thing — `AppError` subclasses return their own message/status, anything else (including raw `Error` and unexpected exceptions) is logged server-side via `console.error` and returns a generic `"Internal server error"` with no stack trace to the client. **This is already correct and is not being rewritten.** Gaps found:
- `sessionMiddleware.ts:40-46` and `adminMiddleware.ts:58-64` build their **own** ad-hoc error response shape (`{ error: ..., code: ... }` vs. the standard `{ data, error, status }` from `apiResponse.ts`) instead of reusing `errorResponse()` — inconsistent shape between these two middlewares and every other route. Fixed by routing both through the existing `errorResponse()` helper.
- Repository-layer errors mostly `throw new Error(error.message)` directly from Postgrest errors (confirmed across `cartRepository`/`wishlistRepository`/etc.) — these Postgrest messages are already generic enough not to leak schema details in practice (checked several: things like `"duplicate key value violates unique constraint..."`), but as a hardening step, unexpected (non-`AppError`) errors bubbling out of a repository still land in `errorResponse()`'s catch-all, which already strips them to "Internal server error" for the client while logging the real message server-side — so this is **already covered** by the fix above, not a separate gap.

---

## Task 11 — Logging

**Reuse existing stubs** (`src/lib/utils/sentry.ts`'s `captureError`/`captureMessage`, `src/lib/utils/auditLog.ts`'s `logAuditEvent`) rather than inventing a new logging system — these are already correctly designed as swap-in-a-real-provider-later seams and are currently only used by nothing (dead but ready). Wire them into:
- Auth failures (bad OTP, expired OTP, invalid admin login) → `captureMessage(..., 'warning')`
- Admin access (every successful `requireAdmin()` call) → `logAuditEvent({ action: 'admin_access', ... })` — lightweight, not per-field-change auditing (that would be new scope)
- Checkout failures (`OrderService.create` throwing) → `captureError`
- Unexpected exceptions in `errorResponse()`'s catch-all → `captureError` (replaces/augments the existing plain `console.error`)

**Never logged:** verified no existing `console.*` call anywhere logs a password, token, OTP code, or service key (grep-checked) — the two auth middlewares only log the *error message*, not the credential itself. Keeping that discipline explicit in the new OTP code (log "OTP send failed for phone X" never the code itself, log "OTP verify failed" never the submitted code).

---

## Task 12 — Environment Variables

**Audit (verified against `env.ts` and `.env.local.example`):** `env.ts` currently validates only the three Supabase vars at startup; `ADMIN_EMAIL`/`ADMIN_PASSWORD` are read directly with `process.env.X` in the admin login route with no startup validation (so a missing `ADMIN_PASSWORD` fails at first login attempt, not at boot — already handled gracefully there with a clear 500 + message, not a crash, so this is a minor robustness gap, not a security one). **Fix:** add `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and the new `SUPABASE_JWT_SECRET` to `env.ts`'s validated set so misconfiguration fails fast at startup instead of at the first request. No `NEXT_PUBLIC_`-prefixed variable currently holds anything that shouldn't be public (checked: only the Supabase URL and anon key, both meant to be public by design). Cloudinary's `CLOUDINARY_API_SECRET` is correctly never `NEXT_PUBLIC_`-prefixed (confirmed in `.env.local.example`'s naming and that it's only read in `storage/providers/cloudinary.ts`, a server-only file).

---

## Task 13 — Production Middleware

**Problem (verified, carried from the original audit and still true):** no `middleware.ts` exists. Admin route protection is entirely client-side (`admin/layout.tsx` fetches `/api/admin/stats` in a `useEffect` just to check auth) — every `/admin/*` page's JS ships and starts rendering before the auth check resolves.

**Fix:** add `src/middleware.ts` scoped narrowly to `/admin/:path*` (excluding `/admin/login`) — verifies the `admin_token` cookie's HMAC signature (the same `verifyAdminToken` logic already in `adminMiddleware.ts`, callable from the Edge runtime since it only uses Node's `crypto` module... actually `node:crypto`'s `createHmac` **is not available in the default Edge middleware runtime** — will use Next's `runtime: 'nodejs'` middleware config (supported in Next 15+) to keep the existing HMAC verification code unchanged rather than reimplementing it with Web Crypto, avoiding a second, parallel implementation of the same signature check that could drift out of sync). Redirects unauthenticated requests to `/admin/login` server-side, before any admin HTML/JS ships — this is a genuine security improvement (defense in depth — the API routes were already protected, but the page shell wasn't) and a genuine perceived-performance improvement (removes the client round trip flagged in the Phase 2-adjacent audit), satisfying Task 13's "only use middleware where it genuinely improves security or performance." **Not adding middleware for anything else** — rate limiting, headers, and API auth are all already handled at better layers (RPC-level, `next.config.ts`, and `requireSession`/`requireAdmin` respectively) and don't need a middleware layer on top.

---

## Task 14 — Database Reliability

**Reviewed:** `create_order_transactional` (Phase 1) — already atomic, already rolls back on any `RAISE EXCEPTION`, already row-locks via `FOR UPDATE` before decrementing. `decrement_stock`/`reserve_stock`/`release_stock`/`increment_coupon_usage` (pre-existing) — each does its own atomic `UPDATE ... WHERE` guard, correct for their single-row scope. **No missing-transaction gaps found beyond what Phase 1 already fixed.** The new `check_rate_limit` and OTP-verify RPCs (this phase) are written with the same atomic-guard pattern for consistency. No explicit statement timeouts are set anywhere (Supabase's platform-level defaults apply) — not overriding these without a demonstrated need, per "do not over-engineer."

---

## Task 15 — Security Audit Sweep

Findings not already covered above, from attempting each listed attack class against the actual code:

| Class | Finding |
|---|---|
| IDOR | `orders/[id]`, `addresses`, `wishlist` routes all derive the owner from the validated session, never from client input — checked, no IDOR found beyond what RLS (Task 3) now backstops |
| Broken authorization | Admin routes uniformly wrapped in `requireAdmin()` — checked every route file, none skip it |
| Session fixation | Not applicable — see Task 1 |
| Replay | OTP codes are single-use + short-expiry (Task 2); session tokens aren't single-use by design (that's normal for a session token, not a replay vulnerability) |
| SQL injection | Not possible via the current architecture — every query goes through Supabase's parameterized query builder or an RPC with typed parameters; no raw string-built SQL exists anywhere (grep-confirmed) |
| Unsafe redirects | No `redirect()` call anywhere takes a user-controlled URL (checked `router.replace`/`router.push` call sites — all hardcoded paths) |
| Race conditions | Stock/coupon race conditions already closed by Phase 1's RPC row-locking; no new races introduced by this phase's OTP/rate-limit RPCs (both use atomic `UPDATE ... RETURNING` guards) |

---

## New Dependencies

| Package | Why |
|---|---|
| `jose` | Sign/verify the custom JWT for RLS (`authenticatedClient.ts`) — lightweight, works in both Node and Edge runtimes |
| `isomorphic-dompurify` | Sanitize product description HTML, save-time and render-time |

## Files Touched (summary — new files not exhaustively listed line-by-line, per the plan format)

New: `authenticatedClient.ts`, `otpRepository.ts` + `OtpService`, `sms/types.ts` + `ConsoleSmsProvider`, `rateLimit.ts` util, `api/auth/otp/send`, `api/auth/otp/verify`, `src/middleware.ts`, migration `031_rls_and_permissions.sql`, migration `032_otp_and_rate_limits.sql`.
Edited: `authService.ts`, `PhoneModal.tsx` (OTP step), `cartRepository.ts`/`wishlistRepository.ts`/`orderRepository.ts`/`UserRepository` (authenticated-client switch on user-scoped calls), `adminMiddleware.ts`/`sessionMiddleware.ts` (error shape), `env.ts`, `next.config.ts` (headers), `ProductService.ts`/`ProductDetailClient.tsx` (sanitization), `admin/auth/login/route.ts` (timing-safe compare), the checkout/coupon/wishlist/cart/admin-login route handlers touched for rate limiting.

## Verification Plan

1. `npx tsc --noEmit` and `npm run build` after each major group (auth/OTP, RLS/client, rate limiting, headers/XSS) — same standard as Phase 1/2.
2. Live-server checks against the running dev server for every touched route, same approach as Phases 1/2 (this environment has no browser automation).
3. **Migration 031 (RLS/grants) is the highest-stakes change in this phase** — I will not deploy it without walking through the exact policies with you first and getting explicit confirmation, separately from the general plan approval, exactly like migration 030 in Phase 1. A mistake here can lock the app out of its own data.
4. Manual checklist and report in `opti_phase3.md`'s exact required format once implementation is done.
