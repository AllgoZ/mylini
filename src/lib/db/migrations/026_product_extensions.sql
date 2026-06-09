-- Migration 026: Product Extensions
-- Adds shipping dimensions, new status values, and barcode to variants

-- 1. Add shipping dimensions to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_grams  INTEGER,
  ADD COLUMN IF NOT EXISTS length_cm     NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS width_cm      NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS height_cm     NUMERIC(8, 2);

-- 2. Extend product_status enum with new values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'hidden'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_status')
  ) THEN
    ALTER TYPE product_status ADD VALUE 'hidden';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'scheduled'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_status')
  ) THEN
    ALTER TYPE product_status ADD VALUE 'scheduled';
  END IF;
END$$;

-- 3. Add barcode to product_variants (future-ready)
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS barcode TEXT;

-- 4. Grant permissions on new columns (anon role needs these for admin writes)
GRANT SELECT, INSERT, UPDATE ON products TO anon;
GRANT SELECT, INSERT, UPDATE ON product_variants TO anon;
