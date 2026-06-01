CREATE TABLE IF NOT EXISTS categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT,
  image_url      TEXT,
  meta_title     TEXT,
  meta_description TEXT,
  og_image       TEXT,
  canonical_url  TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active) WHERE deleted_at IS NULL;
