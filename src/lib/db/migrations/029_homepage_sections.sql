-- Migration 029: Homepage sections CMS table
-- Stores admin-managed content for hero banner, promo blocks, and featured categories

CREATE TABLE homepage_sections (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT        NOT NULL CHECK (section_type IN ('banner', 'promo_block', 'featured_category')),
  title        TEXT,
  subtitle     TEXT,
  body_text    TEXT,
  image_url    TEXT,
  link_url     TEXT,
  link_text    TEXT,
  badge_text   TEXT,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_homepage_sections_type_active ON homepage_sections (section_type, is_active, sort_order);

-- Allow the anon role (used by server-side API routes) full access
GRANT SELECT, INSERT, UPDATE, DELETE ON homepage_sections TO anon;

-- Seed: current hardcoded hero banner
INSERT INTO homepage_sections (section_type, title, subtitle, body_text, link_url, link_text, badge_text, sort_order, is_active, metadata)
VALUES (
  'banner',
  'Comfort in Every Stitch.',
  'Timeless ethnic wear crafted for your little ones — festivals, weddings & everyday magic.',
  NULL,
  '/shop/new',
  'Shop Now',
  'New Collection 2026',
  0,
  TRUE,
  '{"secondary_link_url": "/collections", "secondary_link_text": "View Collections", "offer_text": "₹300 OFF on orders above ₹2500"}'
);

-- Seed: current hardcoded promo blocks
INSERT INTO homepage_sections (section_type, title, subtitle, body_text, image_url, link_url, link_text, badge_text, sort_order, is_active, metadata)
VALUES
  (
    'promo_block',
    'Pattupavadai Collection',
    'Handcrafted designs in premium silk',
    'Girls · 0–7 Years',
    '/products/cat_ban/Peach_dress_-_desktop_version.webp',
    '/shop/girls-traditional',
    'Explore',
    NULL,
    0,
    TRUE,
    '{}'
  ),
  (
    'promo_block',
    'Frocks & Casual Wear',
    'Festive designs starting ₹899',
    'Girls · 0–7 Years',
    '/products/cat_ban/Top_and_Skirt-_Desktop_Version.webp',
    '/shop/frocks-casual',
    'Explore',
    NULL,
    1,
    TRUE,
    '{}'
  );
