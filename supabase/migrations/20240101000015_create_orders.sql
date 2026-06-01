CREATE TABLE IF NOT EXISTS orders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  coupon_id  UUID,
  status     order_status NOT NULL DEFAULT 'pending',
  subtotal   NUMERIC(10, 2) NOT NULL,
  discount   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total      NUMERIC(10, 2) NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_order_total CHECK (total >= 0),
  CONSTRAINT chk_order_discount CHECK (discount >= 0)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
