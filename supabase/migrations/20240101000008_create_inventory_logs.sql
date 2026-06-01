CREATE TABLE IF NOT EXISTS inventory_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  old_stock  INTEGER NOT NULL,
  new_stock  INTEGER NOT NULL,
  reason     inventory_reason NOT NULL,
  created_by UUID,  -- references users(id); nullable — system changes allowed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_logs_variant_id ON inventory_logs(variant_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at DESC);
