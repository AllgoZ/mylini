-- Migration 023: Phase 3A Authentication
-- Creates sessions table for phone-identity authentication
-- Modifies users table to use phone as primary identity

-- ============================================================================
-- 1. Create sessions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id_expires_at
ON sessions(user_id, expires_at);

-- ============================================================================
-- 2. Modify users table: make email optional, phone primary
-- ============================================================================
-- Note: This is safe because no users exist yet in production
-- (MVP phase, only seed data with phone is present)

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_email_key;

ALTER TABLE users
ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users
ADD CONSTRAINT users_phone_key UNIQUE (phone);

-- ============================================================================
-- 3. Add authentication fields to users
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_method TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- ============================================================================
-- 4. Create index on phone for fast lookups
-- ============================================================================
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;

-- ============================================================================
-- 5. Disable RLS on sessions table (Phase 2 pre-auth setup)
-- ============================================================================
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
