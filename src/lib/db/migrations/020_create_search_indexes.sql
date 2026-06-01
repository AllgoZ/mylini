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
