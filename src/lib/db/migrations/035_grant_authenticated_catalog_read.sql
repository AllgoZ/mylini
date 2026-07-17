-- Migration 035: Grant `authenticated` role read access to catalog tables
--
-- Same category of bug as migration 034, different role: migration 031's section 1
-- granted catalog-table SELECT (products, product_variants, product_images, etc.) only
-- to `anon`, never to `authenticated`. `anon` and `authenticated` are separate Postgres
-- roles — a grant to one does not extend to the other. Any query made with the signed-JWT
-- authenticated client (src/lib/db/authenticatedClient.ts) that joins a catalog table now
-- fails with "permission denied for table products" (confirmed live: wishlist's
-- product/product_images join, via WishlistRepository.getItems).
--
-- Postgres's own error hint for this is literally the fix:
--   "Grant the required privileges to the current role with:
--    GRANT SELECT ON public.products TO authenticated;"

GRANT SELECT ON categories, products, product_variants, product_images,
  product_attributes, inventory, inventory_logs, homepage_sections
TO authenticated;
