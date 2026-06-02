import { CouponRepository } from '@/lib/repositories/couponRepository'
import { CouponError } from '@/lib/utils/errors'
import type { AppliedCoupon, ValidateCouponInput, Coupon } from '@/types/coupon'

export const CouponService = {
  async validate({ code, user_id, order_total }: ValidateCouponInput): Promise<AppliedCoupon> {
    const coupon = await CouponRepository.findByCode(code)

    if (!coupon) throw new CouponError('Coupon not found or inactive')

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new CouponError('Coupon has expired')
    }

    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      throw new CouponError('Coupon usage limit reached')
    }

    if (order_total < coupon.minimum_order) {
      throw new CouponError(
        `Minimum order of ₹${coupon.minimum_order} required for this coupon`
      )
    }

    const alreadyUsed = await CouponRepository.hasUserUsed(coupon.id, user_id)
    if (alreadyUsed) throw new CouponError('You have already used this coupon')

    const discount_amount = this.calculateDiscount(coupon, order_total)

    return { coupon, discount_amount }
  },

  calculateDiscount(coupon: { type: 'percentage' | 'fixed'; value: number }, subtotal: number): number {
    if (coupon.type === 'percentage') {
      return Math.min((subtotal * coupon.value) / 100, subtotal)
    }
    return Math.min(coupon.value, subtotal)
  },

  async listAll(filters: { page?: number; limit?: number; search?: string }): Promise<{ coupons: Coupon[]; count: number }> {
    return CouponRepository.findAll(filters)
  },

  async create(data: { code: string; type: 'percentage' | 'fixed'; value: number; minimum_order?: number; usage_limit?: number | null; expires_at?: string | null; is_active?: boolean }): Promise<Coupon> {
    return CouponRepository.create({
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      minimum_order: data.minimum_order ?? 0,
      usage_limit: data.usage_limit ?? null,
      expires_at: data.expires_at ?? null,
      is_active: data.is_active ?? true,
    })
  },

  async update(couponId: string, data: Partial<{ code: string; type: 'percentage' | 'fixed'; value: number; minimum_order: number; usage_limit: number | null; expires_at: string | null; is_active: boolean }>): Promise<Coupon> {
    return CouponRepository.update(couponId, data)
  },

  async disable(couponId: string): Promise<void> {
    return CouponRepository.disable(couponId)
  },
}
