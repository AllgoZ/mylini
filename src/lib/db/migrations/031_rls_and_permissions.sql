-- Migration 031: Row Level Security + least-privilege permissions
--
-- Migration 022 (Phase 2, pre-auth) gave the public `anon` key blanket SELECT/INSERT/
-- UPDATE/DELETE on every transactional table (carts, wishlists, orders, addresses,
-- coupon_usage, and — notably — `users` itself) with RLS disabled everywhere. Since the
-- anon key ships to every browser, this means anyone can currently read/write any user's
-- data directly against the Supabase REST API, bypassing the Next.js app (and its Zod
-- validation, ownership checks, business rules) entirely.
--
-- This migration:
--   1. Revokes anon's blanket grants (REVOKE ALL, then re-grant narrowly — explicit and
--      defensive regardless of exactly which prior grant/default gave anon access).
--   2. Grants the `authenticated` role only what logged-in users need. The app signs a
--      short-lived JWT per authenticated request (src/lib/db/authenticatedClient.ts) with
--      { sub: userId, role: 'authenticated' } using SUPABASE_JWT_SECRET, so auth.uid()
--      resolves correctly even though this app doesn't use Supabase Auth/GoTrue.
--   3. Adds real per-user RLS policies on every user-owned table.
--   4. Leaves `users`, `sessions`, and `otps` (migration 033) with NO anon/authenticated
--      grant at all — these are pre-auth identity-bootstrap tables (there is no session/
--      JWT yet when a phone number is looked up or an OTP is checked), accessed only via
--      the service-role client (src/lib/db/admin.ts), which bypasses RLS/grants by design.
--   5. Removes anon's access to roles/permissions/user_roles entirely — confirmed dead
--      schema (admin auth is the stateless HMAC token, per AGENTS.md; nothing in the
--      current codebase reads these tables for their original purpose).
--
-- Admin operations (product/category/homepage/inventory/coupon writes, order status
-- updates, customer list) already run behind requireAdmin() at the route layer and now
-- also use the service-role client at the repository layer (see the corresponding
-- repository files) — they are unaffected by anon's grants shrinking.

-- ============================================================================
-- 1. Public catalog — anon read-only, no RLS needed (uniformly public, no per-row
--    restriction — a blanket SELECT grant already achieves that).
-- ============================================================================
REVOKE ALL ON categories, products, product_variants, product_images,
  product_attributes, inventory, inventory_logs, homepage_sections
FROM anon;

GRANT SELECT ON categories, products, product_variants, product_images,
  product_attributes, inventory, inventory_logs, homepage_sections
TO anon;

-- ============================================================================
-- 2. Coupons — anon can look up a coupon by code (checkout flow, unauthenticated
--    client), but only active ones; inactive/future codes shouldn't be enumerable.
-- ============================================================================
REVOKE ALL ON coupons FROM anon;
GRANT SELECT ON coupons TO anon;

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon reads active coupons only"
  ON coupons FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================================================
-- 3. Carts / cart_items — anon (guest) may only ever touch guest carts (user_id IS
--    NULL); a logged-in user's cart is only reachable via the authenticated client.
--    Guest session_id is a crypto.randomUUID() (122 bits) — already an adequate
--    bearer-token boundary; RLS here closes "anon can list/touch EVERY cart via the
--    REST API", not the guest addressing model itself.
-- ============================================================================
REVOKE ALL ON carts, cart_items FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON carts, cart_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON carts, cart_items TO authenticated;

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon accesses guest carts only"
  ON carts FOR ALL
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

CREATE POLICY "users access own carts"
  ON carts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anon accesses guest cart items only"
  ON cart_items FOR ALL
  TO anon
  USING (EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id IS NULL))
  WITH CHECK (EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id IS NULL));

CREATE POLICY "users access own cart items"
  ON cart_items FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()));

-- ============================================================================
-- 4. Wishlists / wishlist_items — always user-owned (schema enforces
--    wishlists.user_id UNIQUE NOT NULL, no guest wishlist exists). anon gets nothing.
-- ============================================================================
REVOKE ALL ON wishlists, wishlist_items FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON wishlists, wishlist_items TO authenticated;

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own wishlist"
  ON wishlists FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users access own wishlist items"
  ON wishlist_items FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM wishlists w WHERE w.id = wishlist_items.wishlist_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM wishlists w WHERE w.id = wishlist_items.wishlist_id AND w.user_id = auth.uid()));

-- ============================================================================
-- 5. Addresses — always user-owned, session-gated at the route layer already.
-- ============================================================================
REVOKE ALL ON addresses FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON addresses TO authenticated;

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. Orders / order_items — creation goes through create_order_transactional
--    (migration 030, SECURITY DEFINER — bypasses RLS/grants by design, unaffected by
--    this). Reads only need SELECT; status/tracking updates are admin-only (service
--    role, at the repository layer).
-- ============================================================================
REVOKE ALL ON orders, order_items FROM anon;
GRANT SELECT ON orders, order_items TO authenticated;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

-- ============================================================================
-- 7. Coupon usage — written only via the increment_coupon_usage /
--    create_order_transactional RPCs (SECURITY DEFINER). Users may read their own
--    usage history (used by CouponService.validate's "already used this code?" check).
-- ============================================================================
REVOKE ALL ON coupon_usage FROM anon;
GRANT SELECT ON coupon_usage TO authenticated;

ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own coupon usage"
  ON coupon_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. Users / sessions — pre-auth identity bootstrap. No anon or authenticated grant
--    at all; accessed only via the service-role client (authService.ts,
--    userRepository.ts's identity methods). RLS enabled with no anon/authenticated
--    policy is a defensive backstop — even a future accidental GRANT wouldn't expose
--    rows, since no policy means no access for that role.
-- ============================================================================
REVOKE ALL ON users FROM anon;
REVOKE ALL ON sessions FROM anon;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. roles / permissions / user_roles — confirmed dead schema (Phase 5.1 replaced
--    admin auth with a stateless HMAC token; AGENTS.md explicitly forbids re-adding a
--    user_roles lookup to admin middleware). Remove anon's access entirely rather than
--    design RLS for tables nothing legitimate reads.
-- ============================================================================
REVOKE ALL ON roles, permissions, user_roles FROM anon;
