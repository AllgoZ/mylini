import { createAdminClient } from '@/lib/db/admin'
import type { AdminCredentials, StoreSettings } from '@/types/settings'

// admin_credentials/store_settings postdate the last database.types.ts generation
// (migration 037) — same `as any` situation as otpRepository.ts, until types are
// regenerated. Both tables are singleton (exactly one row, enforced by a unique index
// on a constant expression) and service-role only — no anon/authenticated grant exists.

export const SettingsRepository = {
  async getCredentials(): Promise<AdminCredentials> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any
    const { data, error } = await supabase.from('admin_credentials').select('*').single()
    if (error) throw new Error(error.message)
    return data as AdminCredentials
  },

  async updateCredentials(patch: { admin_email?: string; admin_password_hash?: string }): Promise<AdminCredentials> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any
    const current = await this.getCredentials()
    const { data, error } = await supabase
      .from('admin_credentials')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as AdminCredentials
  },

  async getSettings(): Promise<StoreSettings> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any
    const { data, error } = await supabase.from('store_settings').select('*').single()
    if (error) throw new Error(error.message)
    return data as StoreSettings
  },

  async updateSettings(patch: Partial<Omit<StoreSettings, 'id' | 'updated_at'>>): Promise<StoreSettings> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any
    const current = await this.getSettings()
    const { data, error } = await supabase
      .from('store_settings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as StoreSettings
  },
}
