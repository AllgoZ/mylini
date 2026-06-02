-- Migration 024: Seed Admin Role
-- Creates admin role and helper function to assign admin by phone

-- Insert admin role
INSERT INTO roles (name, description)
VALUES ('admin', 'Full admin access to MYLINI platform')
ON CONFLICT (name) DO NOTHING;

-- Helper: assign admin role by phone number
CREATE OR REPLACE FUNCTION assign_admin_by_phone(p_phone TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM users WHERE phone = p_phone AND deleted_at IS NULL;

  IF v_user_id IS NULL THEN
    RETURN 'User not found for phone: ' || p_phone || '. Log in first, then run this again.';
  END IF;

  SELECT id INTO v_role_id FROM roles WHERE name = 'admin';

  INSERT INTO user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id)
  ON CONFLICT DO NOTHING;

  RETURN 'Admin role assigned to ' || p_phone;
END;
$$;

-- Helper: revoke admin role by phone (useful for testing)
CREATE OR REPLACE FUNCTION revoke_admin_by_phone(p_phone TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE phone = p_phone;
  SELECT id INTO v_role_id FROM roles WHERE name = 'admin';

  DELETE FROM user_roles WHERE user_id = v_user_id AND role_id = v_role_id;

  RETURN 'Admin role revoked from ' || p_phone;
END;
$$;
