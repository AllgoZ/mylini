CREATE TABLE IF NOT EXISTS product_images (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id       UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  storage_provider TEXT NOT NULL DEFAULT 'r2',  -- 'r2' | 'supabase' | 's3'
  storage_key      TEXT NOT NULL,
  public_url       TEXT NOT NULL,
  alt_text         TEXT,
  width            INTEGER,
  height           INTEGER,
  is_primary       BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_variant_id ON product_images(variant_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;
