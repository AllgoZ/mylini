-- Database Verification Checklist — Run After All Migrations Applied
-- Copy and paste this entire script into Supabase SQL Editor and run it
-- All queries should return results (non-empty result sets or confirmation messages)

-- ============================================================================
-- 1. Verify All Tables Exist (should return 20 rows)
-- ============================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 2. Verify All Enums Exist (should return 4 rows)
-- ============================================================================
SELECT typname, typtype
FROM pg_type
WHERE typcategory = 'E'
  AND typowner = (SELECT usesysid FROM pg_user WHERE usename = 'postgres')
ORDER BY typname;

-- ============================================================================
-- 3. Verify All Indexes Created (should return 20+ rows)
-- ============================================================================
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. Verify FTS Trigger Exists on products Table
-- ============================================================================
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'products'
  AND event_object_schema = 'public';

-- ============================================================================
-- 5. Verify RPC Functions Created (should return 4 functions)
-- ============================================================================
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'decrement_stock',
    'reserve_stock',
    'release_stock',
    'increment_coupon_usage',
    'products_search_vector_update'
  )
ORDER BY routine_name;

-- ============================================================================
-- 6. Verify Foreign Key Constraints (should return 15+ rows)
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table_name,
  ccu.column_name AS referenced_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 7. Verify Check Constraints (inventory non-negative, etc.)
-- ============================================================================
SELECT table_name, constraint_name, constraint_definition
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 8. Test FTS: Search Products by search_vector (should return 0 if no data)
-- ============================================================================
SELECT id, name, search_vector
FROM products
WHERE search_vector @@ plainto_tsquery('english', 'pattu')
LIMIT 5;

-- ============================================================================
-- 9. Verify Enum Values
-- ============================================================================

-- product_status enum
SELECT enum_range(NULL::product_status) AS product_status_values;

-- order_status enum
SELECT enum_range(NULL::order_status) AS order_status_values;

-- coupon_type enum
SELECT enum_range(NULL::coupon_type) AS coupon_type_values;

-- inventory_reason enum
SELECT enum_range(NULL::inventory_reason) AS inventory_reason_values;

-- ============================================================================
-- 10. Verify Unique Constraints (carts, wishlists, inventory)
-- ============================================================================
SELECT
  constraint_name,
  table_name,
  column_name
FROM information_schema.constraint_column_usage ccu
JOIN information_schema.table_constraints tc
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY table_name, constraint_name;

-- ============================================================================
-- 11. Verify Partial Unique Index on carts (session_id OR user_id, but not both)
-- ============================================================================
SELECT indexdef
FROM pg_indexes
WHERE tablename = 'carts'
  AND indexname LIKE '%session%' OR indexname LIKE '%user%';

-- ============================================================================
-- 12. Verify Cart Items Unique on (cart_id, variant_id)
-- ============================================================================
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE table_name = 'cart_items'
  AND constraint_type = 'UNIQUE';

-- ============================================================================
-- 13. Verify Coupon Usage Unique on order_id
-- ============================================================================
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE table_name = 'coupon_usage'
  AND constraint_type = 'UNIQUE';

-- ============================================================================
-- 14. Test Inventory Trigger + Check Constraint
-- ============================================================================
-- This checks the structure is ready (you can't test the trigger itself without data)
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;

-- ============================================================================
-- 15. Verify Cart Constraint (user_id XOR session_id)
-- ============================================================================
SELECT constraint_name, constraint_definition
FROM information_schema.check_constraints
WHERE table_name = 'carts';

-- ============================================================================
-- 16. Verify Roles Seeded (admin, staff, customer)
-- ============================================================================
SELECT id, name, created_at
FROM roles
ORDER BY name;

-- ============================================================================
-- SUMMARY: If all queries above return results, your database is ready!
-- ============================================================================
-- Expected results:
-- 1. Tables: 20 rows
-- 2. Enums: 4 rows
-- 3. Indexes: 20+ rows
-- 4. FTS Trigger: 1 row
-- 5. RPC Functions: 4–5 rows (including products_search_vector_update)
-- 6. Foreign Keys: 15+ rows
-- 7. Check Constraints: 6+ rows
-- 8. FTS Test: 0 rows (no data yet)
-- 9. Enum Values: 4 rows
-- 10. Unique Constraints: 6+ rows
-- 11. Carts Partial Indexes: 2 rows
-- 12. Cart Items Unique: 1 row
-- 13. Coupon Usage Unique: 1 row
-- 14. Inventory Columns: 7 rows
-- 15. Cart Constraints: 1 row
-- 16. Roles: 3 rows (admin, customer, staff)

-- If any query returns 0 rows or an error, re-check that migration.
