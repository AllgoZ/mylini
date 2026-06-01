import { createClient } from '@/lib/db/server'
import type { Coupon } from '@/types/coupon'

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
}
