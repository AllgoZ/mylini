import { createClient } from '@/lib/db/server'
import { createAdminClient } from '@/lib/db/admin'
import { createAuthenticatedClient } from '@/lib/db/authenticatedClient'
import type { User, Address, CreateAddressInput } from '@/types/user'

export type CustomerWithStats = User & {
  order_count: number
  total_spend: number
  last_order_at: string | null
}

// `users` carries no anon/authenticated grants (migration 031) — identity-bootstrap
// lookups (phone login, session validation) use the service-role client, same as
// authService.ts. Requires migration 034 (service_role needs an explicit table grant —
// BYPASSRLS alone doesn't give it one, which is what broke login right after 031 shipped
// without it).
export const UserRepository = {
  async findByPhone(phone: string): Promise<User | null> {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .is('deleted_at', null)
      .maybeSingle()

    return data ?? null
  },

  async findById(id: string): Promise<User | null> {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()

    return data ?? null
  },

  async createOrUpdateByPhone(phone: string): Promise<User> {
    const supabase = createAdminClient()

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
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw new Error(error.message)
  },

  async isAdmin(userId: string): Promise<boolean> {
    // Dead code — admin auth is stateless (HMAC token, see AGENTS.md) and never looks
    // up user_roles. Left unused rather than removed (out of scope for this phase).
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

  async createAddress(input: CreateAddressInput): Promise<Address> {
    const supabase = await createAuthenticatedClient(input.user_id)
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: input.user_id,
        name: input.name,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        country: input.country ?? 'India',
        is_default: input.is_default ?? false,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as Address
  },

  async findAddressesByUserId(userId: string): Promise<Address[]> {
    const supabase = await createAuthenticatedClient(userId)
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as Address[]
  },

  async updateAddress(id: string, userId: string, patch: Partial<Omit<CreateAddressInput, 'user_id'>>): Promise<Address> {
    const supabase = await createAuthenticatedClient(userId)

    // Only one default address per user — clear the others first when this one is
    // being promoted, same invariant the checkout UI relies on for preselection.
    if (patch.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
    }

    const { data, error } = await supabase
      .from('addresses')
      .update({ ...patch, updated_at: new Date().toISOString() })
      // auth.uid() = user_id RLS policy (migration 031) already scopes this to the
      // caller's own rows — the explicit eq('user_id', ...) is defense-in-depth.
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Address not found')
    return data as unknown as Address
  },

  async findAll(filters: { search?: string; page?: number; limit?: number }): Promise<{ users: CustomerWithStats[]; count: number }> {
    const supabase = createAdminClient()
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
