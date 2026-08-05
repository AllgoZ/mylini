-- Migration 037: Admin settings panel
--
-- Two singleton tables, deliberately split so a public-read grant on one can never
-- accidentally expose the other:
--
-- admin_credentials — an OPTIONAL override of the ADMIN_EMAIL/ADMIN_PASSWORD env vars.
-- No anon/authenticated grant at all — same posture as users/sessions/otps (migration
-- 031/033), service-role client only. Nullable columns: null means "fall back to the
-- env var", so a fresh deployment with no override row behaves exactly as before this
-- migration — no forced setup step. The admin-token signing secret stays the
-- ADMIN_PASSWORD env var regardless of this override (see SettingsService) — changing
-- the login password here never invalidates an already-issued session token.
--
-- store_settings — operational config (shipping/tax/maintenance/store info). Also no
-- anon/authenticated grant; the storefront reads a narrow, explicit, curated subset of
-- these fields through GET /api/settings (service-role client, server-side), not a
-- direct Supabase grant — one less RLS/grant surface to get wrong for a table that's
-- easy to accidentally widen later (e.g. a careless `select('*')`).

CREATE TABLE IF NOT EXISTS admin_credentials (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email          TEXT,
  admin_password_hash  TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Singleton enforcement — a unique index on a constant expression allows exactly one row.
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_credentials_singleton ON admin_credentials ((true));

REVOKE ALL ON admin_credentials FROM anon, authenticated;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Learned the hard way this session (migrations 034/035/036): BYPASSRLS (which
-- service_role has) only skips row-level policy checks, NOT table-level GRANTs — a
-- brand-new table needs this explicit grant from day one, or every service-role query
-- against it 500s with "permission denied for table admin_credentials".
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_credentials TO service_role;

INSERT INTO admin_credentials DEFAULT VALUES
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS store_settings (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  shipping_charge            NUMERIC NOT NULL DEFAULT 150,
  free_shipping_threshold    NUMERIC NOT NULL DEFAULT 4000,
  tax_rate                   NUMERIC NOT NULL DEFAULT 0,

  maintenance_mode           BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message        TEXT,

  store_name                 TEXT NOT NULL DEFAULT 'MYLINI',
  store_email                TEXT,
  store_phone                TEXT,
  store_address              TEXT,
  order_notification_email   TEXT,

  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_settings_singleton ON store_settings ((true));

REVOKE ALL ON store_settings FROM anon, authenticated;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON store_settings TO service_role;

INSERT INTO store_settings DEFAULT VALUES
ON CONFLICT DO NOTHING;
