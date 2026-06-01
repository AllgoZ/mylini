@AGENTS.md

# MYLINI v2 — AI Assistant Instructions

## Rules

- ALWAYS CREATE IMPLEMENTATION PLAN when I say "create plan", and SAVE THE FILE IN `prompts\Plans`
- NEVER put `SUPABASE_SERVICE_ROLE_KEY` anywhere except `src/lib/db/admin.ts`
- NEVER commit `.env.local` or any file containing secrets
- NEVER add code, features, or abstractions not explicitly requested
- NEVER call Supabase directly from services or API routes — repositories only

---

## Project

MYLINI v2 is a premium Indian children's ethnic wear e-commerce platform.

**Tech stack:** Next.js 16 (App Router) · TypeScript · Supabase (PostgreSQL) · Zod v4 · Zustand · Tailwind CSS · shadcn/ui

**Supabase project:** `jxazdoawlghbfzdmwwmu.supabase.co` (LIVE)

---

## Current Phase

| Phase | Status |
|---|---|
| Phase 1 — Frontend UI | ✅ Done |
| Phase 2 — Backend Foundation | ✅ Done |
| Phase 2.1 — DB Deployment & Verification | ✅ Done |
| Phase 2.2 — Audit & Hardening | ✅ Done |
| Phase 3 — Authentication | 🔲 Next |
| Phase 4 — Payments (Razorpay) | 🔲 Planned |
| Phase 5 — CMS (Sanity) | 🔲 Planned |
| Phase 6 — Email (Resend) | 🔲 Planned |
| Phase 7 — Image Storage (R2) | 🔲 Planned |

---

## Architecture — Read Before Touching Code

```
API Route → Zod validation → Service → Repository → Supabase
```

- **Repositories** (`src/lib/repositories/`) — ONLY place that calls Supabase
- **Services** (`src/lib/services/`) — business logic, calls repositories
- **API Routes** (`src/app/api/`) — validate input, call services, return `ApiResponse<T>`
- **Validations** (`src/lib/validations/`) — Zod schemas per domain (one file per domain)

---

## Supabase Client Architecture

| File | Client Type | Key Used | Use When |
|---|---|---|---|
| `src/lib/db/client.ts` | Browser | NEXT_PUBLIC_SUPABASE_ANON_KEY | Frontend React components |
| `src/lib/db/server.ts` | Server | NEXT_PUBLIC_SUPABASE_ANON_KEY | API routes, server components |
| `src/lib/db/admin.ts` | Admin | SUPABASE_SERVICE_ROLE_KEY | Admin-only operations |

---

## TypeScript / Zod Notes

- **Zod v4** — use `.issues` (not `.errors`, which was removed in v4)
- **database.types.ts** — REAL generated types (1042 lines from live DB). Regenerate with:
  `npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts`
- **Next.js 16 dynamic params** — `params` is a `Promise`; must `await params` before using

---

## Database Status

- **23 migrations deployed** (000–022) to live Supabase project ✅
- **Types generated** from live schema — `src/lib/db/generated/database.types.ts` ✅
- **Seed data inserted** — 4 products, 8 variants, inventory ✅
- **RLS disabled** via migration 022 (Phase 2 pre-auth); Phase 3 adds proper policies
- Migration source: `src/lib/db/migrations/`
- CLI-formatted copies: `supabase/migrations/`

---

## What Currently Works

✅ `npm run dev` — dev server starts  
✅ `npm run build` — 0 TypeScript errors  
✅ `GET /api/products` — returns real Supabase data  
✅ All 6 API routes structured, validated, and connected to DB  
✅ All 7 repositories query live database  
✅ Frontend UI renders (still mock data — wired in Phase 3)

❌ Supabase Auth — not wired (Phase 3)  
❌ Cart/orders require user_id — no auth yet  
❌ Frontend pages use mock data (`src/data/mockProducts.ts`)  
❌ No RLS policies — Phase 3

---

## Key Reference Files

| Need | File |
|---|---|
| Full project overview | `architectureFiles/walkthrough.md` |
| Last session summary | `architectureFiles/handover.md` |
| Detailed file inventory | `architectureFiles/systemstatus.md` |
| API endpoint contracts | `architectureFiles/api-contracts.md` |
| Migration schema audit | `architectureFiles/migration-audit.md` |
| Phase 2.2 audit reports | `architectureFiles/reports/01` through `10` |
| Phase 3 guide | `prompts/nextsteps/NextStep.md` |

---

## How to Add a Feature

1. Add Zod schema in `src/lib/validations/`
2. Add repository method in `src/lib/repositories/` (only Supabase calls here)
3. Add service method in `src/lib/services/` (business logic, no Supabase)
4. Add API route in `src/app/api/`
5. Run `npx tsc --noEmit` — must stay at 0 errors

---

## Known Technical Debt

- `orderService.ts` — no PostgreSQL transaction wrapping multi-step order creation (Phase 3)
- `src/lib/db/migrations/022` — RLS disabled; Phase 3 replaces with per-user policies
- Frontend pages — still using mock data from `src/data/mockProducts.ts` (wire in Phase 3)

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://jxazdoawlghbfzdmwwmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mZEvGayJmorigrGhcrIYzA_eGfL3QVo
SUPABASE_SERVICE_ROLE_KEY=<in .env.local — never commit>
```

All others (R2, Sanity, Resend, Razorpay) are stubs — optional until their respective phases.

---

## Supabase CLI

Project is linked. To re-deploy or push new migrations:

```bash
SUPABASE_ACCESS_TOKEN="sbp_..." npx supabase db push --linked
```
