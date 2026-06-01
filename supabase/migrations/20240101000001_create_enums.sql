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
