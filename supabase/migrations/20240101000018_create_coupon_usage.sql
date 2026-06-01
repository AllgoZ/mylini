CREATE TABLE IF NOT EXISTS coupon_usage (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id  UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE UNIQUE INDEX idx_coupon_usage_order ON coupon_usage(order_id);
