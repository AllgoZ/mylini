CREATE TABLE IF NOT EXISTS inventory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id          UUID NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
  stock_available     INTEGER NOT NULL DEFAULT 0,
  stock_reserved      INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_stock_available CHECK (stock_available >= 0),
  CONSTRAINT chk_stock_reserved CHECK (stock_reserved >= 0)
);

CREATE INDEX idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX idx_inventory_low_stock ON inventory(stock_available, low_stock_threshold);
