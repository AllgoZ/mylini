import { createAdminClient } from '@/lib/db/admin'

// Pre-auth identity bootstrap table (no session exists yet to derive a scoped client
// from) — uses the service-role client, same category as users/sessions. The key itself
// still only lives in src/lib/db/admin.ts; this just imports the factory it exports.

export interface OtpRow {
  id: string
  phone: string
  code_hash: string
  expires_at: string
  attempts: number
  max_attempts: number
  consumed_at: string | null
  created_at: string
}

export const OtpRepository = {
  async create(phone: string, codeHash: string, expiresAt: Date, maxAttempts = 5): Promise<OtpRow> {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('otps')
      .insert({
        phone,
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
        max_attempts: maxAttempts,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as OtpRow
  },

  async findLatestActiveByPhone(phone: string): Promise<OtpRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('phone', phone)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as OtpRow | null
  },

  async incrementAttempts(id: string): Promise<void> {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('increment_otp_attempts', { p_id: id })
    if (error) throw new Error(error.message)
  },

  async markConsumed(id: string): Promise<void> {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}
