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
