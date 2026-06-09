-- Migration 027: Add size_chart_url to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS size_chart_url TEXT;
