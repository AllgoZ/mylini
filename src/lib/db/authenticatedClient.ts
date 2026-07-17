import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'
import type { Database } from './generated/database.types'

// Signs a short-lived JWT carrying { sub: userId, role: 'authenticated' } with the
// project's own JWT secret (Supabase dashboard -> Settings -> API -> JWT Settings), so
// PostgREST resolves auth.uid() to this user for RLS — without ever going through
// Supabase Auth, which this app doesn't use (it has its own phone/OTP + session system).
// The service-role key is NOT used here — this is a real, if self-issued, `authenticated`
// token, scoped to exactly one user, exactly like RLS expects.
async function signUserJwt(userId: string): Promise<string> {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    throw new Error('Missing required environment variable: SUPABASE_JWT_SECRET')
  }

  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('5m') // short-lived — signed fresh per request, not cached/reused
    .sign(new TextEncoder().encode(secret))
}

/**
 * Supabase client scoped to one already-authenticated user (via a validated session —
 * callers must never pass a userId that hasn't already been checked against a real
 * session/cookie). RLS policies using auth.uid() apply to every query made with it.
 */
export async function createAuthenticatedClient(userId: string) {
  const token = await signUserJwt(userId)
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
