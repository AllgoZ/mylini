CREATE TABLE IF NOT EXISTS coupons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  type          coupon_type NOT NULL,
  value         NUMERIC(10, 2) NOT NULL,
  minimum_order NUMERIC(10, 2) NOT NULL DEFAULT 0,
  usage_limit   INTEGER,
  usage_count   INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_coupon_value CHECK (value > 0),
  CONSTRAINT chk_coupon_usage CHECK (usage_count >= 0)
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active, expires_at) WHERE is_active = TRUE;

-- Backfill foreign key on orders now that coupons table exists
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_coupon_id
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;
