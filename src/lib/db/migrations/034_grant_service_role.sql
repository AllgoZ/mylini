-- Migration 034: Explicit service_role grants
--
-- Root cause of the post-031 outage: BYPASSRLS (which service_role has by default in
-- Supabase) only skips *row-level* policy evaluation — it does NOT grant table-level
-- privileges on its own. Migration 031 revoked anon's access to users/sessions/etc. and
-- assumed service_role would work automatically via some project-level default privilege,
-- but no such default exists in this project (confirmed: after 031, even the admin/
-- service-role client got "permission denied for table users"). Every table any
-- repository accesses via createAdminClient() (src/lib/db/admin.ts) needs an explicit
-- grant here — service_role already bypasses RLS, so these grants alone restore full
-- access without reintroducing anon's removed privileges.

GRANT SELECT, INSERT, UPDATE, DELETE ON
  users, sessions, otps,
  categories, products, product_variants, product_images, product_attributes,
  inventory, inventory_logs, homepage_sections,
  carts, cart_items, wishlists, wishlist_items, addresses,
  orders, order_items, coupons, coupon_usage,
  roles, permissions, user_roles,
  rate_limits
TO service_role;

GRANT EXECUTE ON FUNCTION decrement_stock(uuid, int)                          TO service_role;
GRANT EXECUTE ON FUNCTION reserve_stock(uuid, int)                            TO service_role;
GRANT EXECUTE ON FUNCTION release_stock(uuid, int)                            TO service_role;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(uuid)                        TO service_role;
GRANT EXECUTE ON FUNCTION create_order_transactional(uuid,uuid,uuid,numeric,numeric,numeric,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, int, int)                    TO service_role;
GRANT EXECUTE ON FUNCTION increment_otp_attempts(uuid)                        TO service_role;
