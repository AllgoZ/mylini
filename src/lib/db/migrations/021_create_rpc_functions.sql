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
