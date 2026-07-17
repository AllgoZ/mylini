-- Migration 033: OTP verification
-- Replaces phone-only login (no possession proof) with a proper send/verify OTP flow.
-- No RLS/anon grants — this is a pre-auth identity-bootstrap table (no session/user_id
-- exists yet when an OTP is sent or verified), accessed only via the service-role client,
-- same category as users/sessions (see migration 031).

CREATE TABLE IF NOT EXISTS otps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT NOT NULL,
  code_hash    TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_phone_created ON otps(phone, created_at DESC);

-- Defensive: explicitly strip any grant anon/authenticated might otherwise have via a
-- schema-level default privilege, regardless of RLS state.
REVOKE ALL ON otps FROM anon, authenticated;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- Atomic increment so two concurrent verify attempts can't both read the same pre-increment
-- count and both squeak in under max_attempts.
CREATE OR REPLACE FUNCTION increment_otp_attempts(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE otps SET attempts = attempts + 1 WHERE id = p_id;
END;
$$;
