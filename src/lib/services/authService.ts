import { createAdminClient } from '@/lib/db/admin'
import { UserRepository } from '@/lib/repositories/userRepository'
import type { User } from '@/types/user'
import { randomBytes } from 'crypto'

export interface Session {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  user_agent?: string
  ip_address?: string
  created_at: string
}

const SESSION_DURATION_DAYS = 7

// `sessions` (and `users`, via UserRepository's identity methods) carry no anon or
// authenticated-role grants (migration 031) — an unrestricted anon SELECT on `sessions`
// would let anyone dump every session token in the table and hijack any logged-in user.
// This is pre-auth identity-bootstrap machinery, so it uses the service-role client.
// Requires migration 034 (service_role needs an explicit table grant on top of RLS —
// BYPASSRLS alone doesn't give it one).
export const AuthService = {
  /**
   * Authenticate user by phone number.
   * Creates user if doesn't exist, creates new session.
   */
  async authenticateByPhone(
    phone: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ user: User; session: Session }> {
    const user = await UserRepository.createOrUpdateByPhone(phone)
    const session = await this.createSession(user.id, userAgent, ipAddress)
    return { user, session }
  },

  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<Session> {
    const supabase = createAdminClient()
    const sessionToken = randomBytes(32).toString('hex')

    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as Session
  },

  /**
   * Validate session token.
   * Returns user if session is valid and not expired, null otherwise.
   */
  async validateSession(sessionToken: string): Promise<User | null> {
    const supabase = createAdminClient()

    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error || !session) return null

    const user = await UserRepository.findById(session.user_id)
    return user
  },

  /**
   * Delete session (logout).
   */
  async logout(sessionToken: string): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('session_token', sessionToken)

    if (error) throw new Error(error.message)
  },

  /**
   * Get session by token (internal use).
   */
  async getSession(sessionToken: string): Promise<Session | null> {
    const supabase = createAdminClient()

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .maybeSingle()

    return data ? (data as unknown as Session) : null
  },
}
