-- ============================================================
-- MYLINI v2 — Full Migration Script (All 22 Migrations)
-- Run this entire script in Supabase SQL Editor
-- Wrapped in a transaction: if anything fails, nothing is applied
-- Generated: 2026-06-01
-- ============================================================

BEGIN;

-- ============================================================
-- Migration 000: 000_enable_extensions.sql
-- ============================================================
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- Migration 001: 001_create_enums.sql
-- ============================================================
-- Product lifecycle status
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Coupon discount type
DO $$ BEGIN
  CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order lifecycle status
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Inventory change reason
DO $$ BEGIN
  CREATE TYPE inventory_reason AS ENUM (
    'purchase',
    'restock',
    'adjustment',
    'cancellation'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Migration 002: 002_create_categories.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT,
  image_url      TEXT,
  meta_title     TEXT,
  meta_description TEXT,
  og_image       TEXT,
  canonical_url  TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active) WHERE deleted_at IS NULL;

-- ============================================================
-- Migration 003: 003_create_products.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  status           product_status NOT NULL DEFAULT 'draft',
  base_price       NUMERIC(10, 2) NOT NULL,
  sale_price       NUMERIC(10, 2),
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller   BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival   BOOLEAN NOT NULL DEFAULT FALSE,
  meta_title       TEXT,
  meta_description TEXT,
  og_image         TEXT,
  canonical_url    TEXT,
  search_vector    TSVECTOR,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_products_is_best_seller ON products(is_best_seller) WHERE is_best_seller = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_products_is_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = TRUE AND deleted_at IS NULL;

-- Full Text Search index
CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);

-- Auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'english',
    COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, description
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();

-- ============================================================
-- Migration 004: 004_create_product_variants.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color          TEXT,
  size           TEXT,
  sku            TEXT NOT NULL UNIQUE,
  price_override NUMERIC(10, 2),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_active ON product_variants(product_id, is_active) WHERE deleted_at IS NULL;

-- ============================================================
-- Migration 005: 005_create_product_images.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id       UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  storage_provider TEXT NOT NULL DEFAULT 'r2',  -- 'r2' | 'supabase' | 's3'
  storage_key      TEXT NOT NULL,
  public_url       TEXT NOT NULL,
  alt_text         TEXT,
  width            INTEGER,
  height           INTEGER,
  is_primary       BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_variant_id ON product_images(variant_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;

-- ============================================================
-- Migration 006: 006_create_product_attributes.sql
-- ============================================================
-- Key-value attribute store — no hardcoded columns.
-- Supported keys: material, fabric_type, age_group, gender, occasion,
--                 care_instructions, or any future custom attribute.
CREATE TABLE IF NOT EXISTS product_attributes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_attributes_product_id ON product_attributes(product_id);
CREATE INDEX idx_product_attributes_key ON product_attributes(key);

-- ============================================================
-- Migration 007: 007_create_inventory.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id          UUID NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
  stock_available     INTEGER NOT NULL DEFAULT 0,
  stock_reserved      INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_stock_available CHECK (stock_available >= 0),
  CONSTRAINT chk_stock_reserved CHECK (stock_reserved >= 0)
);

CREATE INDEX idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX idx_inventory_low_stock ON inventory(stock_available, low_stock_threshold);

-- ============================================================
-- Migration 008: 008_create_inventory_logs.sql
-- ============================================================
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

-- ============================================================
-- Migration 009: 009_create_users.sql
-- ============================================================
-- User id will match Supabase Auth uid when auth is integrated.
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- Migration 010: 010_create_addresses.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  line1      TEXT NOT NULL,
  line2      TEXT,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  pincode    TEXT NOT NULL,
  country    TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = TRUE;

-- ============================================================
-- Migration 011: 011_create_carts.sql
-- ============================================================
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

-- ============================================================
-- Migration 012: 012_create_cart_items.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (cart_id, variant_id),
  CONSTRAINT chk_cart_item_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_variant_id ON cart_items(variant_id);

-- ============================================================
-- Migration 013: 013_create_wishlists.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);

-- ============================================================
-- Migration 014: 014_create_wishlist_items.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (wishlist_id, product_id)
);

CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);

-- ============================================================
-- Migration 015: 015_create_orders.sql
-- ============================================================
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

-- ============================================================
-- Migration 016: 016_create_order_items.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id            UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity              INTEGER NOT NULL,
  unit_price            NUMERIC(10, 2) NOT NULL,
  total_price           NUMERIC(10, 2) NOT NULL,
  -- Snapshots preserve historical accuracy after catalog changes
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot          TEXT NOT NULL,
  variant_snapshot      TEXT NOT NULL,  -- e.g. "Pink / 2Y"
  image_snapshot        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_order_item_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- ============================================================
-- Migration 017: 017_create_coupons.sql
-- ============================================================
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

-- ============================================================
-- Migration 018: 018_create_coupon_usage.sql
-- ============================================================
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

-- ============================================================
-- Migration 019: 019_create_roles.sql
-- ============================================================
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

-- ============================================================
-- Migration 020: 020_create_search_indexes.sql
-- ============================================================
-- Trigram index for partial/fuzzy matching on product name
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN(name gin_trgm_ops);

-- Trigram index on category name for autocomplete
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
  ON categories USING GIN(name gin_trgm_ops);

-- Composite index for product listing queries (category + status + flags)
CREATE INDEX IF NOT EXISTS idx_products_listing
  ON products(category_id, status, is_featured, is_best_seller, is_new_arrival)
  WHERE deleted_at IS NULL;

-- ============================================================
-- Migration 021: 021_create_rpc_functions.sql
-- ============================================================
-- Migration 021: Create RPC Functions for Inventory & Coupon Operations
-- These functions are called by inventoryRepository and couponRepository
-- Using SECURITY DEFINER so they bypass RLS policies

-- decrement_stock: Atomically decrement stock_available for a variant
CREATE OR REPLACE FUNCTION decrement_stock(p_variant_id uuid, p_quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory
  SET stock_available = stock_available - p_quantity,
      updated_at = NOW()
  WHERE variant_id = p_variant_id
    AND stock_available >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
  END IF;
END;
$$;

-- reserve_stock: Move quantity from stock_available to stock_reserved
CREATE OR REPLACE FUNCTION reserve_stock(p_variant_id uuid, p_quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory
  SET stock_available = stock_available - p_quantity,
      stock_reserved = stock_reserved + p_quantity,
      updated_at = NOW()
  WHERE variant_id = p_variant_id
    AND stock_available >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock to reserve for variant %', p_variant_id;
  END IF;
END;
$$;

-- release_stock: Move quantity from stock_reserved back to stock_available
CREATE OR REPLACE FUNCTION release_stock(p_variant_id uuid, p_quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory
  SET stock_available = stock_available + p_quantity,
      stock_reserved = stock_reserved - p_quantity,
      updated_at = NOW()
  WHERE variant_id = p_variant_id
    AND stock_reserved >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient reserved stock for variant %', p_variant_id;
  END IF;
END;
$$;

-- increment_coupon_usage: Atomically increment the coupon usage count
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = p_coupon_id
    AND (usage_limit IS NULL OR usage_count < usage_limit)
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon % is invalid, expired, or at usage limit', p_coupon_id;
  END IF;
END;
$$;

COMMIT;

-- ============================================================
-- If you see this line, all 22 migrations applied successfully.
-- Now run: scripts/verify-database.sql to confirm structure.
-- ============================================================
