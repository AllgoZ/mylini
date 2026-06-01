-- user_id is NULL for guest carts; session_id is NULL for logged-in carts.
-- Guest-to-user merge: when user logs in, cart items are moved from
-- the session_id cart to the user_id cart.
CREATE TABLE IF NOT EXISTS carts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_cart_owner CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_carts_user_id ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_carts_session_id ON carts(session_id) WHERE session_id IS NOT NULL;
