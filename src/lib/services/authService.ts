import { createClient } from '@/lib/db/server'
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
    // Create or get user by phone
    const user = await UserRepository.createOrUpdateByPhone(phone)

    // Create session
    const session = await this.createSession(user.id, userAgent, ipAddress)

    return { user, session }
  },

  /**
   * Create new session for user.
   * Returns session with token to be stored in httpOnly cookie.
   */
  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<Session> {
    const supabase = await createClient()

    // Generate secure random token (32 bytes = 64 hex chars)
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
    const supabase = await createClient()

    // Find session that hasn't expired
    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error || !session) return null

    // Get user
    const user = await UserRepository.findById(session.user_id)
    return user
  },

  /**
   * Delete session (logout).
   */
  async logout(sessionToken: string): Promise<void> {
    const supabase = await createClient()

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
    const supabase = await createClient()

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .maybeSingle()

    return data ? (data as unknown as Session) : null
  },
}
