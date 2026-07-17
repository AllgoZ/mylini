<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:admin-auth-rules -->
# Admin Auth Is Stateless — Read Before Touching Admin Routes

Admin authentication uses **HMAC-signed cookies** — no database user, no `user_roles` table, no `sessions` table.

- `requireAdmin()` in `src/lib/middleware/adminMiddleware.ts` verifies the `admin_token` cookie signature inline
- `AdminContext = { adminEmail: string }` — there is NO `ctx.user` field
- Login issues a signed token; there is no session row created in any table
- To get the acting admin identity in a route: use `ctx.adminEmail`
- NEVER add back a user_roles or sessions lookup to admin middleware
<!-- END:admin-auth-rules -->

<!-- BEGIN:server-bundle-rules -->
# A Top-Level Import in a Shared Module Ships to Every Route That Imports That Module — Read Before Adding a Heavy or Node-Only Dependency

Next.js bundles a route's *entire reachable server-side import graph* into that route's own serverless function — including code paths the route never actually calls. This already crashed production once: `src/lib/utils/sanitizeHtml.ts` had a top-level `import DOMPurify from 'isomorphic-dompurify'`. That function is only called from `ProductService.create`/`update` (admin-only), but `ProductService` is also imported by the public homepage/product/shop pages for unrelated read methods — so `isomorphic-dompurify`'s `jsdom` dependency got bundled into every one of those routes' functions too, and `jsdom` failed to load in Vercel's runtime ("Failed to load external module jsdom-..."), crashing every storefront page with a 500 on every single request. Full incident: `architectureFiles/FIXES_APPLIED.md`, 2026-07-17.

- **Rule**: if a dependency is only needed by one narrow code path (an admin-only write, an OTP send, etc.), `await import(...)` it lazily *inside* the function that uses it — never as a top-level `import` in a module that anything on a public/high-traffic route also imports (check via `grep -rn "from '@/path/to/module'"` before adding one).
- This is invisible in `npx tsc --noEmit` and `npm run build` locally — both succeed either way. It only surfaces as a runtime crash on the deployment platform. If a route works locally (`next dev`/`next start`) but 500s only when deployed, a bundling issue like this is a prime suspect — check the platform's runtime/function logs, not just the build log.
- Separately: any Supabase client that calls `cookies()` (`src/lib/db/server.ts`) forces the *entire* route into dynamic, uncached, per-request rendering the moment it's used anywhere in that route's render tree — even though this app's public reads never actually use the cookie value. This silently defeats `export const revalidate = N`. Confirmed: `/`, `/product/[slug]`, and `/shop/[category]` all build as `ƒ Dynamic`, not `○ Static`, despite `revalidate = 60` in their `page.tsx`. Not yet fixed — be aware of it before assuming these routes are ISR-cached.
<!-- END:server-bundle-rules -->
