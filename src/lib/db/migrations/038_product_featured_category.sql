-- Migration 038: Product-level Featured Category tagging
--
-- Featured Category (homepage_sections, section_type='featured_category') has been a
-- purely decorative CMS list until now — curated by hand, no relationship to the actual
-- catalog, so a tile could (and did) show on the homepage even when zero products
-- related to it. This adds a real, optional, single-select link from a product to the
-- Featured Category it belongs to, so "Shop By Category" can show only tiles that at
-- least one product actually carries.
--
-- Nullable, ON DELETE SET NULL — a product is never required to have one, and deleting
-- a Featured Category CMS row never blocks on products still referencing it, it just
-- un-tags them.
--
-- No new GRANT needed: anon/authenticated/service_role already have table-level grants
-- on `products` (migrations 022/031/034) — Postgres grants aren't column-scoped, so a
-- new column is covered automatically. Learned the hard way (034/035/036) that a brand
-- new TABLE needs its own explicit grant; a new column on an already-granted table does
-- not.

ALTER TABLE products ADD COLUMN featured_category_id UUID REFERENCES homepage_sections(id) ON DELETE SET NULL;
CREATE INDEX idx_products_featured_category_id ON products(featured_category_id);
