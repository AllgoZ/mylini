-- Migration 022: Phase 2 API Permissions
-- Grants anon role access to all tables used by the API.
-- Phase 3 will replace this with proper per-user RLS policies.

-- ============================================================================
-- Public catalog tables — disable RLS (no user context needed)
-- ============================================================================
ALTER TABLE categories        DISABLE ROW LEVEL SECURITY;
ALTER TABLE products          DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants  DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images    DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory         DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs    DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Transactional tables — disable RLS (Phase 2: no auth yet)
-- Phase 3 will re-enable with user-scoped policies
-- ============================================================================
ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses      DISABLE ROW LEVEL SECURITY;
ALTER TABLE carts          DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items     DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists      DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders         DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons        DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage   DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles          DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions    DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles     DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Grant anon role SELECT on public catalog tables
-- ============================================================================
GRANT SELECT ON categories, products, product_variants,
               product_images, product_attributes,
               inventory, inventory_logs, roles, permissions
TO anon;

-- ============================================================================
-- Grant anon role full CRUD on transactional tables (API-driven operations)
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE
ON carts, cart_items, wishlists, wishlist_items,
   orders, order_items, coupons, coupon_usage,
   users, addresses, user_roles
TO anon;

-- ============================================================================
-- Grant anon role EXECUTE on all RPC functions
-- ============================================================================
GRANT EXECUTE ON FUNCTION decrement_stock(uuid, int)         TO anon;
GRANT EXECUTE ON FUNCTION reserve_stock(uuid, int)           TO anon;
GRANT EXECUTE ON FUNCTION release_stock(uuid, int)           TO anon;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(uuid)       TO anon;
