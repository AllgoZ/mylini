import type { Database } from '@/lib/db/generated/database.types'

export type Coupon = Database['public']['Tables']['coupons']['Row']
export type CouponUsage = Database['public']['Tables']['coupon_usage']['Row']
export type CouponType = Database['public']['Enums']['coupon_type']

export type AppliedCoupon = {
  coupon: Coupon
  discount_amount: number
}

export type ValidateCouponInput = {
  code: string
  user_id: string
  order_total: number
}
