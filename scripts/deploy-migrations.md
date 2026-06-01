# Deploying MYLINI v2 Migrations to Supabase

## Prerequisites

- Supabase project created at `https://jxazdoawlghbfzdmwwmu.supabase.co`
- You have admin access to the project
- `.env.local` is configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## How to Deploy Migrations

### Step 1: Access Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project: `mylini-v2` (or the one you created at `jxazdoawlghbfzdmwwmu.supabase.co`)
3. Left sidebar → **SQL Editor**
4. Click **New Query** button

You'll see an empty text editor with a "Run" button (or use `Ctrl+Enter` / `Cmd+Enter` to execute).

---

### Step 2: Run Migrations in Exact Order

Copy-paste each migration file **one at a time** from your project's `src/lib/db/migrations/` folder, in this exact sequence:

```
000_enable_extensions.sql
001_create_enums.sql
002_create_categories.sql
003_create_products.sql
004_create_product_variants.sql
005_create_product_images.sql
006_create_product_attributes.sql
007_create_inventory.sql
008_create_inventory_logs.sql
009_create_users.sql
010_create_addresses.sql
011_create_carts.sql
012_create_cart_items.sql
013_create_wishlists.sql
014_create_wishlist_items.sql
015_create_orders.sql
016_create_order_items.sql
017_create_coupons.sql
018_create_coupon_usage.sql
019_create_roles.sql
020_create_search_indexes.sql
021_create_rpc_functions.sql
```

### For Each Migration:

1. Open the file in your code editor at `src/lib/db/migrations/XXX_filename.sql`
2. **Copy all the SQL code** (Ctrl+A, Ctrl+C)
3. Go to Supabase SQL Editor → **New Query**
4. **Paste the SQL** (Ctrl+V)
5. Click **Run** button (or press Ctrl+Enter)
6. Wait for the result. You should see:
   - **Success banner** (green) with "Query executed successfully"
   - Or no error messages at the bottom
7. Move to the next migration

**⚠️ DO NOT run multiple migrations in one query.**
**Order matters.** Running out of order will fail with FK constraint or "table does not exist" errors.

---

## Important Notes

### Migration 017 (`create_coupons.sql`) — ALTER TABLE Expected

This migration creates the `coupons` table, then uses:

```sql
ALTER TABLE orders ADD CONSTRAINT fk_orders_coupon_id
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
```

This is **expected**. The `orders` table was created in migration 015 with a nullable `coupon_id` column, but the FK constraint is added retroactively in 017 (after `coupons` exists).

---

## Verifying Each Migration

After each successful run, you can check the Supabase dashboard:

- **Tables** → left sidebar → should see your new tables appearing
- **Enums** → left sidebar → should see the 4 enums after migration 001
- **Functions** → left sidebar → should see the 4 RPC functions after migration 021

---

## If Something Goes Wrong

### "Syntax Error" or "Parse Error"

- Check you copied the **entire file** (including all statements)
- Check for missing semicolons (each SQL statement should end with `;`)
- Re-read the error message — it will point to a line number

### "Foreign Key Constraint Violation"

- You likely skipped a migration or ran them out of order
- Example: running 012 before 011 will fail because 012 references 011's table
- Start over: delete all tables via Supabase dashboard and re-run migrations in order

### "Relation 'coupons' does not exist" (on migration 017)

- You skipped migration 017 earlier
- Run migration 017 in sequence (after 016, before 018)

### "Function already exists"

- Harmless — you ran the same migration twice
- The database ignores duplicate `CREATE OR REPLACE` statements
- Continue to the next migration

---

## Rollback Strategy (If You Need to Start Over)

If migrations fail partway through and you need to reset:

### Option 1: Delete via Dashboard (Easiest)

1. Go to Supabase Dashboard
2. Left sidebar → **Tables**
3. For each table you created, click the menu (three dots) → **Delete table**
4. Left sidebar → **Enums** → delete all custom enums
5. Start over with migration 000

### Option 2: Rollback via SQL (Advanced)

If you want to drop everything and restart, run this query once:

```sql
-- Drop all tables (in reverse of creation order)
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS product_attributes CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop custom enums
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS coupon_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS inventory_reason CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS products_search_vector_update() CASCADE;
DROP FUNCTION IF EXISTS decrement_stock(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS reserve_stock(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS release_stock(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS increment_coupon_usage(uuid) CASCADE;
```

Then start migrations from 000 again.

---

## Next Steps After Migrations Complete

Once all 22 migrations run successfully (000–021):

1. **Generate TypeScript types:**
   ```bash
   npx supabase gen types typescript --project-id jxazdoawlghbfzdmwwmu > src/lib/db/generated/database.types.ts
   ```

2. **Verify database structure:**
   - Run `scripts/verify-database.sql` in Supabase SQL Editor
   - Check that all queries return non-empty results

3. **Seed sample data (optional):**
   - Run `scripts/seed.sql` in Supabase SQL Editor
   - This inserts 4 products with variants for testing

4. **Check TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   Should still be 0 errors.

5. **Test the API:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000/api/products` in your browser — should return `"items": []` initially (empty database).

---

## Timeline

- **Migrations 000–010:** ~5 minutes (foundation tables)
- **Migrations 011–018:** ~5 minutes (business logic tables)
- **Migrations 019–020:** ~2 minutes (RBAC + indexes)
- **Migration 021:** ~1 minute (RPC functions)
- **Type generation + seed:** ~5 minutes

**Total: ~20 minutes to fully deploy and seed.**

---

## Questions?

If a migration fails:
1. **Read the error message carefully** — it tells you what went wrong
2. **Check the migration file** — look for typos or missing columns
3. **Verify order** — make sure you're running migrations 000 → 021 in sequence
4. **Check Supabase status** — is the project running? (go to Dashboard → Overview)

**Do NOT skip migrations or run them out of order.**
