-- Seed Script: Sample MYLINI v2 Data for Testing
-- Run this AFTER all migrations are applied (000–021)
-- This script is idempotent (can be run multiple times without errors)

-- ============================================================================
-- 1. Seed Categories
-- ============================================================================
INSERT INTO categories (name, slug, description, is_active, sort_order)
VALUES
  ('Traditional Wear', 'traditional-wear', 'Indian traditional ethnic clothing for children', true, 1),
  ('Girls Traditional', 'girls-traditional', 'Traditional dresses for girls', true, 2),
  ('Boys Traditional', 'boys-traditional', 'Traditional wear for boys', true, 3),
  ('Frocks & Casual', 'frocks-casual', 'Modern frocks and casual Indian wear', true, 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. Seed Products (INSERT per row to avoid UNION ALL type inference issues)
-- ============================================================================
INSERT INTO products (category_id, name, slug, description, status, base_price, sale_price, is_featured, is_best_seller, is_new_arrival)
VALUES (
  (SELECT id FROM categories WHERE slug = 'girls-traditional'),
  'Pattu Pavadai Set', 'pattu-pavadai-set',
  'Beautiful silk pavadai with matching blouse and hair accessory. Perfect for festivals and celebrations.',
  'active', 3500, 2999, true, true, false
)
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, slug, description, status, base_price, sale_price, is_featured, is_best_seller, is_new_arrival)
VALUES (
  (SELECT id FROM categories WHERE slug = 'girls-traditional'),
  'Kanchipuram Silk Lehenga', 'kanchipuram-silk-lehenga',
  'Traditional Kanchipuram silk lehenga set with dupatta and blouse. Ideal for weddings and special occasions.',
  'active', 5000, 4299, true, true, true
)
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, slug, description, status, base_price, sale_price, is_featured, is_best_seller, is_new_arrival)
VALUES (
  (SELECT id FROM categories WHERE slug = 'frocks-casual'),
  'Cotton Frock Set', 'cotton-frock-set',
  'Comfortable cotton frock for everyday wear. Available in multiple colors and designs.',
  'active', 1200, 899, false, false, true
)
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, slug, description, status, base_price, sale_price, is_featured, is_best_seller, is_new_arrival)
VALUES (
  (SELECT id FROM categories WHERE slug = 'boys-traditional'),
  'Boys Dhoti Shirt Set', 'boys-dhoti-shirt-set',
  'Traditional cotton dhoti and shirt set for boys. Perfect for festivals and traditional events.',
  'active', 2000, 1599, true, false, false
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. Seed Product Variants
-- ============================================================================
INSERT INTO product_variants (product_id, color, size, sku, price_override)
VALUES
  ((SELECT id FROM products WHERE slug = 'pattu-pavadai-set'),     'Gold',        '2Y', 'PATTU-GLD-2Y', NULL),
  ((SELECT id FROM products WHERE slug = 'pattu-pavadai-set'),     'Pink',        '3Y', 'PATTU-PKG-3Y', NULL),
  ((SELECT id FROM products WHERE slug = 'kanchipuram-silk-lehenga'), 'Maroon',   '4Y', 'KAN-MRN-4Y',   NULL),
  ((SELECT id FROM products WHERE slug = 'kanchipuram-silk-lehenga'), 'Peacock Blue', '5Y', 'KAN-PBL-5Y', NULL),
  ((SELECT id FROM products WHERE slug = 'cotton-frock-set'),      'Red',         '2Y', 'FRK-RED-2Y',   NULL),
  ((SELECT id FROM products WHERE slug = 'cotton-frock-set'),      'Blue',        '3Y', 'FRK-BLU-3Y',   NULL),
  ((SELECT id FROM products WHERE slug = 'boys-dhoti-shirt-set'),  'Cream',       '4Y', 'DHO-CRM-4Y',   NULL),
  ((SELECT id FROM products WHERE slug = 'boys-dhoti-shirt-set'),  'White',       '5Y', 'DHO-WHT-5Y',   NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. Seed Product Images (placeholder URLs — storage_key is path in bucket)
-- ============================================================================
INSERT INTO product_images (product_id, storage_key, public_url, storage_provider, width, height, is_primary, sort_order)
VALUES
  ((SELECT id FROM products WHERE slug = 'pattu-pavadai-set'),
   'seed/pattu-pavadai-set.jpg',
   'https://images.unsplash.com/photo-1610623785006-872e15c1e34c?w=500', 'supabase', 500, 500, true, 1),
  ((SELECT id FROM products WHERE slug = 'kanchipuram-silk-lehenga'),
   'seed/kanchipuram-silk-lehenga.jpg',
   'https://images.unsplash.com/photo-1609563287073-c6f650cbf14d?w=500', 'supabase', 500, 500, true, 1),
  ((SELECT id FROM products WHERE slug = 'cotton-frock-set'),
   'seed/cotton-frock-set.jpg',
   'https://images.unsplash.com/photo-1516762689632-6a47ba0d5e1f?w=500', 'supabase', 500, 500, true, 1),
  ((SELECT id FROM products WHERE slug = 'boys-dhoti-shirt-set'),
   'seed/boys-dhoti-shirt-set.jpg',
   'https://images.unsplash.com/photo-1623529392537-a39d0a373d8b?w=500', 'supabase', 500, 500, true, 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. Seed Inventory (10 units per variant, low stock threshold 2)
-- ============================================================================
INSERT INTO inventory (variant_id, stock_available, stock_reserved, low_stock_threshold)
SELECT id, 10, 0, 2
FROM product_variants
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. Seed Product Attributes
-- ============================================================================
INSERT INTO product_attributes (product_id, key, value)
VALUES
  ((SELECT id FROM products WHERE slug = 'pattu-pavadai-set'),       'fabric_type', 'Silk'),
  ((SELECT id FROM products WHERE slug = 'pattu-pavadai-set'),       'gender',      'Girls'),
  ((SELECT id FROM products WHERE slug = 'pattu-pavadai-set'),       'occasion',    'Festival, Wedding'),
  ((SELECT id FROM products WHERE slug = 'kanchipuram-silk-lehenga'),'fabric_type', 'Kanchipuram Silk'),
  ((SELECT id FROM products WHERE slug = 'kanchipuram-silk-lehenga'),'gender',      'Girls'),
  ((SELECT id FROM products WHERE slug = 'kanchipuram-silk-lehenga'),'occasion',    'Wedding, Festival'),
  ((SELECT id FROM products WHERE slug = 'cotton-frock-set'),        'fabric_type', 'Cotton'),
  ((SELECT id FROM products WHERE slug = 'cotton-frock-set'),        'gender',      'Girls'),
  ((SELECT id FROM products WHERE slug = 'cotton-frock-set'),        'occasion',    'Casual, Everyday'),
  ((SELECT id FROM products WHERE slug = 'boys-dhoti-shirt-set'),    'fabric_type', 'Cotton'),
  ((SELECT id FROM products WHERE slug = 'boys-dhoti-shirt-set'),    'gender',      'Boys'),
  ((SELECT id FROM products WHERE slug = 'boys-dhoti-shirt-set'),    'occasion',    'Festival, Traditional')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. Verification summary
-- ============================================================================
SELECT
  (SELECT COUNT(*) FROM categories)         AS total_categories,
  (SELECT COUNT(*) FROM products)           AS total_products,
  (SELECT COUNT(*) FROM product_variants)   AS total_variants,
  (SELECT COUNT(*) FROM inventory)          AS total_inventory,
  (SELECT COUNT(*) FROM product_attributes) AS total_attributes,
  (SELECT COUNT(*) FROM product_images)     AS total_images;
