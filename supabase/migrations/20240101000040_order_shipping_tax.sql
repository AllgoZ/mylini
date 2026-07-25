-- Migration 040: Persist shipping/tax on orders
--
-- orders.total was always just `subtotal - discount` — shipping and tax, which the
-- checkout page computes and shows the customer as part of the amount they owe, were
-- never actually persisted or included in the stored order total. This adds the two
-- missing columns and replaces create_order_transactional (migration 030) so it accepts
-- and stores them. OrderService.create() now computes shipping/tax server-side (mirroring
-- the storefront checkout page's own formula) instead of trusting a client-sent amount —
-- same trust model already used for subtotal.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_charge NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION create_order_transactional(
  p_user_id uuid,
  p_address_id uuid,
  p_coupon_id uuid,
  p_subtotal numeric,
  p_discount numeric,
  p_shipping numeric,
  p_tax numeric,
  p_total numeric,
  p_notes text,
  p_items jsonb  -- [{variant_id, quantity, unit_price, total_price, product_name_snapshot, sku_snapshot, variant_snapshot, image_snapshot}]
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity int;
  v_new_stock int;
BEGIN
  -- Pass 1: lock + validate stock for every item before writing anything.
  -- FOR UPDATE holds the row lock for the rest of this transaction, so a
  -- concurrent order for the same variant blocks here until this one commits
  -- or rolls back, then re-validates against the now-current stock.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    PERFORM 1 FROM inventory
      WHERE variant_id = v_variant_id
        AND stock_available >= v_quantity
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_variant_id;
    END IF;
  END LOOP;

  INSERT INTO orders (user_id, address_id, coupon_id, status, subtotal, discount, shipping_charge, tax_amount, total, notes)
  VALUES (p_user_id, p_address_id, p_coupon_id, 'pending', p_subtotal, p_discount, p_shipping, p_tax, p_total, p_notes)
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    INSERT INTO order_items (
      order_id, variant_id, quantity, unit_price, total_price,
      product_name_snapshot, sku_snapshot, variant_snapshot, image_snapshot
    )
    VALUES (
      v_order.id, v_variant_id, v_quantity,
      (v_item->>'unit_price')::numeric, (v_item->>'total_price')::numeric,
      v_item->>'product_name_snapshot', v_item->>'sku_snapshot',
      v_item->>'variant_snapshot', v_item->>'image_snapshot'
    );

    UPDATE inventory
      SET stock_available = stock_available - v_quantity,
          updated_at = NOW()
      WHERE variant_id = v_variant_id
        AND stock_available >= v_quantity
      RETURNING stock_available INTO v_new_stock;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_variant_id;
    END IF;

    INSERT INTO inventory_logs (variant_id, old_stock, new_stock, reason)
    VALUES (v_variant_id, v_new_stock + v_quantity, v_new_stock, 'purchase');
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    INSERT INTO coupon_usage (coupon_id, user_id, order_id)
    VALUES (p_coupon_id, p_user_id, v_order.id);

    UPDATE coupons
      SET usage_count = usage_count + 1,
          updated_at = NOW()
      WHERE id = p_coupon_id
        AND (usage_limit IS NULL OR usage_count < usage_limit)
        AND (expires_at IS NULL OR expires_at > NOW());

    IF NOT FOUND THEN
      RAISE EXCEPTION 'COUPON_INVALID:%', p_coupon_id;
    END IF;
  END IF;

  RETURN v_order;
END;
$$;

-- Drop the old 9-arg signature — Postgres allows function overloading by arg count, and
-- leaving the old one around would let stale client code silently call the version that
-- never stored shipping/tax.
DROP FUNCTION IF EXISTS create_order_transactional(uuid, uuid, uuid, numeric, numeric, numeric, text, jsonb);

GRANT EXECUTE ON FUNCTION create_order_transactional(uuid, uuid, uuid, numeric, numeric, numeric, numeric, numeric, text, jsonb) TO anon;
