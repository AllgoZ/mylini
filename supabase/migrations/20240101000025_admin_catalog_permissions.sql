-- Migration 025: Admin catalog write permissions
-- Migration 022 only granted SELECT on catalog tables to anon role.
-- Admin product create/update/delete operations require INSERT/UPDATE/DELETE.
-- All catalog write endpoints are protected by requireAdmin() at the API layer.

GRANT INSERT, UPDATE, DELETE
  ON products, product_variants, product_images,
     product_attributes, inventory, inventory_logs
  TO anon;
