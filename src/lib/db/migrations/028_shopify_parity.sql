-- Migration 028: Shopify Parity Fields
-- Adds product_type, tags, charge_tax, compare_at_price, cost_per_item,
-- sell_when_out_of_stock, inventory_tracked

-- Products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type       TEXT,
  ADD COLUMN IF NOT EXISTS tags               TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS charge_tax         BOOLEAN NOT NULL DEFAULT TRUE;

-- Product Variants
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS compare_at_price   NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS cost_per_item      NUMERIC(10, 2);

-- Inventory
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS inventory_tracked      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sell_when_out_of_stock BOOLEAN NOT NULL DEFAULT FALSE;

-- Permissions
GRANT SELECT, INSERT, UPDATE ON products TO anon;
GRANT SELECT, INSERT, UPDATE ON product_variants TO anon;
GRANT SELECT, INSERT, UPDATE ON inventory TO anon;
