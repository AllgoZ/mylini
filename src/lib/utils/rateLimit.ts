import { createClient } from '@/lib/db/server'
import { captureError } from './sentry'

export interface RateLimitResult {
  allowed: boolean
  retryAfter: number
}

/**
 * Fixed-window rate limit check backed by the check_rate_limit Postgres function
 * (migration 032). `key` should already be scoped to what you're limiting, e.g.
 * `otp-send:${phone}` or `admin-login:${ip}`.
 *
 * Fails OPEN on an unexpected error (logged via captureError) — a transient DB hiccup
 * on the rate-limit check itself must not be able to lock every customer out of login
 * or checkout. This is a deliberate choice, not an oversight: rate limiting here is
 * defense-in-depth layered on top of other protections (OTP's own per-code attempt/
 * expiry limits, the admin password itself), not the only thing standing between an
 * attacker and the account.
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      captureError(error, { source: 'checkRateLimit', key })
      return { allowed: true, retryAfter: 0 }
    }

    const row = Array.isArray(data) ? data[0] : data
    return { allowed: row?.allowed ?? true, retryAfter: row?.retry_after ?? 0 }
  } catch (err) {
    captureError(err, { source: 'checkRateLimit', key })
    return { allowed: true, retryAfter: 0 }
  }
}
