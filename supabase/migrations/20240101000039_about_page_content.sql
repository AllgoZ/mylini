-- Migration 039: About Us page — fully admin-editable
--
-- Singleton table (same pattern as store_settings/admin_credentials, migration 037):
-- exactly one row, enforced by a unique index on a constant expression. No anon/
-- authenticated grant — the storefront About page reads it server-side via the
-- service-role client (AboutService.get(), called from an async Server Component),
-- same posture as store_settings' "narrow, explicit, curated read, not a direct grant"
-- rationale.
--
-- Default values below are the exact text/numbers the About page currently has
-- hardcoded, so deploying this migration causes zero visible change until an admin
-- actually edits something through the new /admin/about page.
--
-- stats / values are JSONB arrays rather than child tables — small, fixed-shape,
-- admin-only-written content with no need for independent querying, matching how
-- homepage_sections already uses a metadata jsonb column for the same kind of
-- flexible-but-small structured content.

CREATE TABLE IF NOT EXISTS about_page_content (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  eyebrow_text             TEXT NOT NULL DEFAULT 'Our Journey & Philosophy',
  heading_line1            TEXT NOT NULL DEFAULT 'From a Mother''s Heart',
  heading_line2            TEXT NOT NULL DEFAULT 'to a Luxury Boutique',
  intro_text               TEXT NOT NULL DEFAULT 'Mylini is a premium Indian ethnic wear brand specializing in handcrafted Pattupavadai, silk frocks, and traditional outfits for girls and boys, born out of love, heritage, and the pursuit of ultimate comfort.',

  narrative_image_url      TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
  narrative_heading_line1  TEXT NOT NULL DEFAULT 'Rooted in Tradition,',
  narrative_heading_line2  TEXT NOT NULL DEFAULT 'Designed for Joy',
  narrative_paragraph1     TEXT NOT NULL DEFAULT 'As parents, we love the visual richness of traditional fabrics—the shimmering zari work, the deep vibrant jewel tones, the geometric precision of classic borders. But all too often, kids traditional wear is heavy, scratchy, and uncomfortable.',
  narrative_paragraph2     TEXT NOT NULL DEFAULT 'We set out to change that. Mylini fuses India''s rich textile heritage with meticulous garment engineering. Each piece is constructed with pre-washed premium silks and lined with a signature, highly breathable 100% pre-washed cotton underskirt to ensure scratch-free, all-day festive play.',
  stats                    JSONB NOT NULL DEFAULT '[{"value":"10K+","label":"Families"},{"value":"100%","label":"Cotton Lined"},{"value":"5.0 ★","label":"Avg Rating"}]',

  values_heading           TEXT NOT NULL DEFAULT 'The Pillars of Mylini',
  values_subtitle          TEXT NOT NULL DEFAULT 'Every outfit is designed based on four uncompromising principles that guide our craft.',
  values                   JSONB NOT NULL DEFAULT '[{"icon":"heart","title":"Comfort First","description":"All our silk dresses are crafted with pre-washed pure cotton lining, offering 100% scratch-free, all-day festive comfort."},{"icon":"award","title":"Heritage Weaving","description":"We source authentic Kanchipuram, Banarasi, and Mysore silk, supporting master weavers keeping ancient craft traditions alive."},{"icon":"sparkles","title":"Meticulous Detailing","description":"From custom handmade zari patterns to premium fabric-covered back buttons, no detail is too small for our design team."},{"icon":"smile","title":"Joyful Childhoods","description":"Our designs are breathable and movement-friendly, so children can run, dance, and play freely through every celebration."}]',

  cta_heading              TEXT NOT NULL DEFAULT 'Discover the Collection',
  cta_text                 TEXT NOT NULL DEFAULT 'Dress your little ones in traditional heritage crafted with infinite love and comfort for your next grand celebration.',
  cta_button1_text         TEXT NOT NULL DEFAULT 'Shop Girls',
  cta_button1_link         TEXT NOT NULL DEFAULT '/shop/girls',
  cta_button2_text         TEXT NOT NULL DEFAULT 'Shop Boys',
  cta_button2_link         TEXT NOT NULL DEFAULT '/shop/boys',

  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_about_page_content_singleton ON about_page_content ((true));

REVOKE ALL ON about_page_content FROM anon, authenticated;
ALTER TABLE about_page_content ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON about_page_content TO service_role;

INSERT INTO about_page_content DEFAULT VALUES
ON CONFLICT DO NOTHING;
