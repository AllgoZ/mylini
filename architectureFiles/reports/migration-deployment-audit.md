# Migration Deployment Audit Report
**Date:** 2026-06-01  
**Scope:** Migration structure, CLI readiness, deployment recommendation  
**Project Ref:** jxazdoawlghbfzdmwwmu  
**Status:** ✅ READY FOR DEPLOYMENT (after 3 bug fixes applied)

---

## Audit Summary

| Check | Result |
|---|---|
| Migration count | ✅ 22 files (000–021) |
| Naming consistency | ✅ Sequential: `NNN_description.sql` |
| Enum dependencies | ✅ All enums created in 001 before use |
| Extension ordering | ✅ All extensions in 000 with `IF NOT EXISTS` |
| FK dependency order | ✅ FIXED (see Bug 1 below) |
| RPC column references | ✅ FIXED (see Bug 2 below) |
| Enum idempotency | ✅ FIXED (see Bug 3 below) |
| Circular references | ✅ None remaining after fixes |
| CLI configured | ❌ No `supabase/` directory exists |
| CLI installed globally | ❌ Not installed |
| CLI via npx | ✅ `npx supabase` version 2.103.0 |

---

## Phase 1 — Migration Compatibility Report

### Bugs Found and Fixed

---

#### BUG 1 — CRITICAL: Forward FK in Migration 015 (Deployment Blocker)

**File:** `src/lib/db/migrations/015_create_orders.sql`  
**Line 5 before fix:**
```sql
coupon_id  UUID REFERENCES coupons(id) ON DELETE SET NULL,
```

**Problem:** `coupons` table is created in migration **017** — two migrations later. Running 015 as written would produce:
```
ERROR: relation "coupons" does not exist
```
The entire `orders` table would fail to create. All subsequent migrations (016, 017, 018) would also fail because `orders` doesn't exist.

**Root cause:** The original design intent was for 015 to create a bare `coupon_id UUID` column with no FK, and for migration 017 to add the FK via `ALTER TABLE orders ADD CONSTRAINT` after `coupons` is created. The bare column was accidentally written with an inline reference.

**Fix applied:**
```sql
-- BEFORE (broken)
coupon_id  UUID REFERENCES coupons(id) ON DELETE SET NULL,

-- AFTER (correct)
coupon_id  UUID,
```

Migration 017 already contains the correct `ALTER TABLE`:
```sql
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_coupon_id
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;
```
This now works correctly — orders is created without the FK, coupons is created in 017, then the FK is added.

**Status: ✅ Fixed**

---

#### BUG 2 — CRITICAL: Wrong Column Name in RPC Function (Runtime Blocker)

**File:** `src/lib/db/migrations/021_create_rpc_functions.sql`  
**Line 76 before fix (inside `increment_coupon_usage`):**
```sql
AND (expiry_date IS NULL OR expiry_date > NOW());
```

**Problem:** The `coupons` table (migration 017) defines the column as `expires_at`, not `expiry_date`:
```sql
expires_at    TIMESTAMPTZ,
```

The function would compile successfully (PostgreSQL compiles PL/pgSQL lazily), but would **fail at runtime** with:
```
ERROR: column "expiry_date" does not exist
```
Every time a coupon was applied to an order, `CouponRepository.incrementUsage()` would throw. This would break all coupon functionality silently — the function is `CREATE OR REPLACE` so it would appear to install without error.

**Cross-reference:** `couponService.ts` line 11 correctly uses `coupon.expires_at`. TypeScript types also use `expires_at`. Only the SQL function had the wrong name.

**Fix applied:**
```sql
-- BEFORE (broken)
AND (expiry_date IS NULL OR expiry_date > NOW());

-- AFTER (correct)
AND (expires_at IS NULL OR expires_at > NOW());
```

**Status: ✅ Fixed**

---

#### BUG 3 — LOW: Enum Creation Not Idempotent (Quality Fix)

**File:** `src/lib/db/migrations/001_create_enums.sql`  
**Before fix:**
```sql
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
```

**Problem:** `CREATE TYPE` without `IF NOT EXISTS` fails if the type already exists. On a fresh database (which this is), this runs fine. But if a migration ever needs to be re-run, or if the Supabase SQL Editor runs it twice by mistake, it will fail:
```
ERROR: type "product_status" already exists
```

**Fix applied:** Wrapped all 4 `CREATE TYPE` statements in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` blocks.

```sql
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

This is idempotent — safe to run any number of times.

**Status: ✅ Fixed**

---

### Migration Dependency Order (Verified)

All 22 migrations run in a valid dependency order after fixes:

```
000  Extensions (uuid-ossp, pg_trgm, unaccent)
001  Enums (4 types — used by 003, 008, 015, 017)
002  categories
003  products ← depends on 002 (categories), 001 (product_status enum)
004  product_variants ← depends on 003
005  product_images ← depends on 003, 004
006  product_attributes ← depends on 003
007  inventory ← depends on 004
008  inventory_logs ← depends on 004, 001 (inventory_reason enum)
009  users
010  addresses ← depends on 009
011  carts ← depends on 009
012  cart_items ← depends on 011, 004
013  wishlists ← depends on 009
014  wishlist_items ← depends on 013, 003
015  orders ← depends on 009, 010 (no FK to coupons now — FIXED)
016  order_items ← depends on 015, 004
017  coupons + ALTER TABLE orders (adds FK to coupons) ← depends on 015
018  coupon_usage ← depends on 017, 009, 015
019  roles + permissions + user_roles ← depends on 009
020  search indexes ← depends on 003, 002
021  RPC functions ← depends on 007, 017 (uses expires_at — FIXED)
```

No circular references. No forward references remaining.

---

### Idempotency Summary (Post-Fix)

| Migration | Idempotent | Notes |
|---|---|---|
| 000 | ✅ | `IF NOT EXISTS` on all extensions |
| 001 | ✅ | Fixed: `DO $$...EXCEPTION` block |
| 002–020 | ✅ | `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` |
| 015 | ✅ | Fixed: bare `coupon_id UUID` column |
| 017 | ⚠️ | `ALTER TABLE ADD CONSTRAINT` will fail if run twice — acceptable, only run once |
| 021 | ✅ | `CREATE OR REPLACE FUNCTION`, column name fixed |

### PostgreSQL 15+ Compatibility: ✅ PASS

---

## Phase 2 — CLI Readiness Report

### Directory Check

```
mylini-v2/
├── src/lib/db/migrations/   ← migrations ARE here (22 files)
└── (no supabase/ directory)
```

**Result: ❌ Supabase CLI is NOT configured for this project.**

- No `supabase/` directory
- No `supabase/config.toml`
- No `supabase/migrations/` directory
- No migration history tracking

### CLI Installation

| Method | Status |
|---|---|
| Global (`supabase`) | ❌ Not installed (`command not found`) |
| npx (`npx supabase`) | ✅ Available — version 2.103.0 |

### What `supabase db push` Requires

To use `supabase db push`, we would need to:

1. **`supabase init`** — creates `supabase/config.toml` and `supabase/migrations/` directory
2. **`supabase link --project-ref jxazdoawlghbfzdmwwmu`** — links to the remote project (requires login token)
3. **Rename all 22 migration files** — CLI requires timestamp naming: `20240101000000_create_categories.sql` (not `002_create_categories.sql`)
4. **Move files** to `supabase/migrations/`
5. **Run `supabase db push`**

The naming conversion alone requires renaming 22 files consistently and in order — this is additional error-prone work that adds no value for a one-time deployment.

---

## Phase 3 — CLI Install Status

Supabase CLI is available via `npx supabase@2.103.0` without global installation. No action needed if using Path B (SQL Editor).

If CLI path is chosen, install globally:
```bash
npm install -g supabase
supabase --version
```

---

## Phase 4 — Project Link Report

**Status: Not linked** (no `supabase/` directory).

If CLI path is chosen:
```bash
npx supabase login       # opens browser for auth token
npx supabase link --project-ref jxazdoawlghbfzdmwwmu
```

**Not required for Path B (SQL Editor).**

---

## Phase 5 — Final Deployment Recommendation

### ✅ Recommended: Path B — Manual SQL Editor

**Recommendation: Deploy using Supabase SQL Editor, not `supabase db push`.**

**Technical justification:**

| Factor | `supabase db push` (Path A) | SQL Editor (Path B) |
|---|---|---|
| CLI configured? | ❌ No — requires setup | ✅ No setup needed |
| Migration naming | ❌ Requires renaming 22 files | ✅ Files work as-is |
| Error feedback | Medium — CLI output | ✅ Immediate inline errors |
| Control per step | Medium — runs all at once | ✅ Run one at a time |
| Risk if one fails | High — unclear state | ✅ Know exactly which failed |
| Setup time | ~30 min | ~20 min |
| Auth required | Yes (supabase login) | ✅ Already logged into dashboard |

**The SQL Editor approach:**
- Requires no CLI configuration
- Matches the existing `scripts/deploy-migrations.md` guide exactly
- Gives per-migration success/failure feedback
- Is the safest option for a first deployment with no prior migration history

---

## Pre-Deployment Checklist

Before running any migration:

- [x] `.env.local` — `NEXT_PUBLIC_SUPABASE_URL` set ✅
- [x] `.env.local` — `NEXT_PUBLIC_SUPABASE_ANON_KEY` set ✅
- [x] `.env.local` — `SUPABASE_SERVICE_ROLE_KEY` set ✅
- [x] Migration 015 — inline FK removed ✅
- [x] Migration 021 — `expiry_date` → `expires_at` fixed ✅
- [x] Migration 001 — enum idempotency fixed ✅
- [x] All 22 migrations verified in order ✅

**All 22 migrations are now ready to deploy.**

---

## Deployment Steps (Upon Approval)

1. Go to [https://app.supabase.com](https://app.supabase.com) → project `jxazdoawlghbfzdmwwmu`
2. Left sidebar → **SQL Editor** → **New Query**
3. Run each file from `src/lib/db/migrations/` in order: **000 → 001 → ... → 021**
4. After all 22 complete: run `scripts/verify-database.sql` to confirm
5. Run `scripts/seed.sql` for sample data
6. Generate types: `npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts`
7. Run `npx tsc --noEmit` — must remain 0 errors

Full guide: `scripts/deploy-migrations.md`

---

**Awaiting approval to proceed with deployment.**
