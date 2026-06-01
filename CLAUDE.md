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

**Tech stack:** Next.js (App Router) · TypeScript · Supabase (PostgreSQL) · Zod v4 · Zustand · Tailwind CSS · shadcn/ui

**Supabase project:** `jxazdoawlghbfzdmwwmu.supabase.co`

---

## Current Phase

| Phase | Status |
|---|---|
| Phase 1 — Frontend UI | ✅ Done |
| Phase 2 — Backend Foundation | ✅ Done |
| Phase 2.1 — DB Deployment & Verification | ✅ Done |
| Phase 3 — Authentication | 🔲 Next |

---

## Architecture — Read Before Touching Code

```
API Route → Zod validation → Service → Repository → Supabase
```

- **Repositories** (`src/lib/repositories/`) — ONLY place that calls Supabase
- **Services** (`src/lib/services/`) — business logic, calls repositories
- **API Routes** (`src/app/api/`) — validate input, call services, return `ApiResponse<T>`
- **Validations** (`src/lib/validations/`) — Zod schemas per domain

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
- **database.types.ts** — currently hand-crafted; replace with `npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts` after DB setup
- **`as any` casts in repositories** — intentional; disappear after type generation
- **Next.js 16 dynamic params** — `params` is a `Promise`; must `await params` before using

---

## Database Status

- 22 migrations ready: `src/lib/db/migrations/000–021`
- **NOT YET APPLIED** to Supabase
- Migration guide: `scripts/deploy-migrations.md`
- Verification SQL: `scripts/verify-database.sql`
- Seed data: `scripts/seed.sql`

---

## What Currently Works

✅ `npm run dev` — dev server starts  
✅ `npm run build` — 0 TypeScript errors  
✅ All API routes structured and validated  
✅ All repositories query correct tables  
✅ Frontend UI renders (mock data)  

❌ API calls fail (no database connection)  
❌ Cart/wishlist API not connected to DB  
❌ Auth not wired (Phase 3)  

---

## Key Reference Files

| Need | File |
|---|---|
| Full project overview | `architectureFiles/walkthrough.md` |
| Last session summary | `architectureFiles/handover.md` |
| Detailed file inventory | `architectureFiles/systemstatus.md` |
| Frontend structure | `architectureFiles/fontend.md` |
| Migration audit | `architectureFiles/migration-audit.md` |
| API contracts | `architectureFiles/api-contracts.md` |
| Readiness report | `architectureFiles/phase21-readiness-report.md` |
| Phase 2 plan | `prompts/Plans/backend_foundation_plan.md` |
| Phase 3 guide | `prompts/nextsteps/NextStep.md` |

---

## How to Add a Feature

1. Add Zod schema in `src/lib/validations/`
2. Add repository method in `src/lib/repositories/` (only Supabase calls here)
3. Add service method in `src/lib/services/` (business logic)
4. Add API route in `src/app/api/`
5. Run `npx tsc --noEmit` (must stay at 0 errors)

---

## Known Technical Debt

- `orderService.ts` — no PostgreSQL transaction (Phase 3)
- `orderService.ts` — direct Supabase query for snapshots (should use ProductRepository)
- `api/categories/route.ts` — calls repository directly, no service (minor)
- `api/wishlist/route.ts` — inline Zod schema (should import from validations/)
- Frontend pages — still using mock data from `src/data/mockProducts.ts`
- No RLS policies yet — Phase 3

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://jxazdoawlghbfzdmwwmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mZEvGayJmorigrGhcrIYzA_eGfL3QVo
SUPABASE_SERVICE_ROLE_KEY=  ← fill from Supabase Dashboard → Settings → API
```

All others (R2, Sanity, Resend, Razorpay) are optional until their respective phases.
