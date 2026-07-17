-- Migration 032: Rate limiting
-- A Supabase-table-backed fixed-window limiter — no new external service (Redis/Upstash)
-- needed. Same atomic-guard style as decrement_stock/increment_coupon_usage: a single
-- upsert statement does the check-and-increment, so concurrent requests can't race past
-- the limit.

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS needed here — the table has no user-identifying data (keys are things like
-- "otp-send:+919999999999" or "admin-login:1.2.3.4"), and it's only ever touched via the
-- SECURITY DEFINER function below, never selected/updated directly.

CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_limit INT, p_window_seconds INT)
RETURNS TABLE(allowed BOOLEAN, retry_after INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  INSERT INTO rate_limits AS rl (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rl.window_start <= v_now - (p_window_seconds || ' seconds')::interval THEN 1
      ELSE rl.count + 1
    END,
    window_start = CASE
      WHEN rl.window_start <= v_now - (p_window_seconds || ' seconds')::interval THEN v_now
      ELSE rl.window_start
    END
  RETURNING rl.count, rl.window_start INTO v_count, v_window_start;

  IF v_count <= p_limit THEN
    RETURN QUERY SELECT true, 0;
  ELSE
    RETURN QUERY SELECT
      false,
      GREATEST(0, p_window_seconds - EXTRACT(EPOCH FROM (v_now - v_window_start))::INT);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit(text, int, int) TO anon;
