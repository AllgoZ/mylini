CREATE TABLE IF NOT EXISTS order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id            UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity              INTEGER NOT NULL,
  unit_price            NUMERIC(10, 2) NOT NULL,
  total_price           NUMERIC(10, 2) NOT NULL,
  -- Snapshots preserve historical accuracy after catalog changes
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot          TEXT NOT NULL,
  variant_snapshot      TEXT NOT NULL,  -- e.g. "Pink / 2Y"
  image_snapshot        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_order_item_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);
