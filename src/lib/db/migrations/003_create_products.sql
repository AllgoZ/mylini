CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  status           product_status NOT NULL DEFAULT 'draft',
  base_price       NUMERIC(10, 2) NOT NULL,
  sale_price       NUMERIC(10, 2),
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller   BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival   BOOLEAN NOT NULL DEFAULT FALSE,
  meta_title       TEXT,
  meta_description TEXT,
  og_image         TEXT,
  canonical_url    TEXT,
  search_vector    TSVECTOR,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_products_is_best_seller ON products(is_best_seller) WHERE is_best_seller = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_products_is_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = TRUE AND deleted_at IS NULL;

-- Full Text Search index
CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);

-- Auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'english',
    COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, description
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();
