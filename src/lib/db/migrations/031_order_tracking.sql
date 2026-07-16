-- Migration 031: Add shipment tracking fields to orders
-- Admin can enter a tracking number and courier tracking URL when packing/shipping an order.
-- Both columns are nullable — no existing orders are affected.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url    text;
