import { createClient } from '@/lib/db/server'
import type { User } from '@/types/user'

export const UserRepository = {
  async findByPhone(phone: string): Promise<User | null> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .is('deleted_at', null)
      .maybeSingle()

    return data ?? null
  },

  async findById(id: string): Promise<User | null> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()

    return data ?? null
  },

  async createOrUpdateByPhone(phone: string): Promise<User> {
    const supabase = await createClient()

    // Try to find existing user
    const existing = await this.findByPhone(phone)
    if (existing) {
      // Update last_login_at
      const { data, error } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as unknown as User
    }

    // Create new user with phone
    const { data, error } = await supabase
      .from('users')
      .insert({ phone })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as User
  },

  async updateLastLogin(userId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw new Error(error.message)
  },
}
