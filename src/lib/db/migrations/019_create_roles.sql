-- RBAC foundation — structured for future RLS policies.
-- Roles: admin, staff, customer

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,  -- 'admin' | 'staff' | 'customer'
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,  -- e.g. 'products', 'orders'
  action   TEXT NOT NULL   -- e.g. 'read', 'write', 'delete'
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Seed default roles
INSERT INTO roles (name, description) VALUES
  ('admin',    'Full system access'),
  ('staff',    'Inventory and order management'),
  ('customer', 'Standard customer access')
ON CONFLICT (name) DO NOTHING;
