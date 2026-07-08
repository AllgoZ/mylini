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
