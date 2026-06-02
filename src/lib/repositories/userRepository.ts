import { createClient } from '@/lib/db/server'
import type { User } from '@/types/user'

export type CustomerWithStats = User & {
  order_count: number
  total_spend: number
  last_order_at: string | null
}

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

  async isAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', userId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('roles.name' as any, 'admin')
      .maybeSingle()

    if (error) return false
    return !!data
  },

  async findAll(filters: { search?: string; page?: number; limit?: number }): Promise<{ users: CustomerWithStats[]; count: number }> {
    const supabase = await createClient()
    const page = filters.page ?? 1
    const limit = filters.limit ?? 50
    const from = (page - 1) * limit

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (filters.search) {
      query = query.ilike('phone', `%${filters.search}%`)
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    // Aggregate order stats per user in a separate query
    const userIds = (data ?? []).map((u: any) => u.id)
    let statsMap: Record<string, { order_count: number; total_spend: number; last_order_at: string | null }> = {}

    if (userIds.length > 0) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('user_id, total, created_at')
        .in('user_id', userIds)
        .neq('status', 'cancelled')

      for (const o of orderData ?? []) {
        if (!statsMap[o.user_id]) statsMap[o.user_id] = { order_count: 0, total_spend: 0, last_order_at: null }
        statsMap[o.user_id].order_count += 1
        statsMap[o.user_id].total_spend += o.total
        if (!statsMap[o.user_id].last_order_at || o.created_at > statsMap[o.user_id].last_order_at!) {
          statsMap[o.user_id].last_order_at = o.created_at
        }
      }
    }

    const users: CustomerWithStats[] = (data ?? []).map((u: any) => ({
      ...u,
      order_count: statsMap[u.id]?.order_count ?? 0,
      total_spend: statsMap[u.id]?.total_spend ?? 0,
      last_order_at: statsMap[u.id]?.last_order_at ?? null,
    }))

    return { users, count: count ?? 0 }
  },
}
