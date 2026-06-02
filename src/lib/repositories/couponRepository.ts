import { createClient } from '@/lib/db/server'
import type { Coupon } from '@/types/coupon'
import type { Database } from '@/lib/db/generated/database.types'

type CouponInsert = Database['public']['Tables']['coupons']['Insert']
type CouponUpdate = Database['public']['Tables']['coupons']['Update']

export const CouponRepository = {
  async findByCode(code: string): Promise<Coupon | null> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    return data ?? null
  },

  async incrementUsage(couponId: string): Promise<void> {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('increment_coupon_usage', { p_coupon_id: couponId })
    if (error) throw new Error(error.message)
  },

  async recordUsage(couponId: string, userId: string, orderId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('coupon_usage')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ coupon_id: couponId, user_id: userId, order_id: orderId } as any)

    if (error) throw new Error(error.message)
  },

  async hasUserUsed(couponId: string, userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', couponId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return !!data
  },

  async findAll(filters: { page?: number; limit?: number; search?: string }): Promise<{ coupons: Coupon[]; count: number }> {
    const supabase = await createClient()
    const page = filters.page ?? 1
    const limit = filters.limit ?? 30
    const from = (page - 1) * limit

    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (filters.search) {
      query = query.ilike('code', `%${filters.search.toUpperCase()}%`)
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return { coupons: (data ?? []) as Coupon[], count: count ?? 0 }
  },

  async create(data: CouponInsert): Promise<Coupon> {
    const supabase = await createClient()
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({ ...data, code: (data.code as string).toUpperCase() } as any)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return coupon as Coupon
  },

  async update(couponId: string, data: CouponUpdate): Promise<Coupon> {
    const supabase = await createClient()
    const { data: coupon, error } = await (supabase as any)
      .from('coupons')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', couponId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return coupon as Coupon
  },

  async disable(couponId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('coupons')
      .update({ is_active: false })
      .eq('id', couponId)

    if (error) throw new Error(error.message)
  },
}
