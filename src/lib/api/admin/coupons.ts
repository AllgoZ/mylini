import { apiFetch } from './index'
import type { Coupon } from '@/types/coupon'
import type { CreateCouponInput, UpdateCouponInput } from '@/lib/validations/adminCouponSchema'

export async function adminGetCoupons(filters: { search?: string; page?: number; limit?: number } = {}): Promise<{ coupons: Coupon[]; count: number }> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })
  return apiFetch<{ coupons: Coupon[]; count: number }>(`/api/admin/coupons?${params}`)
}

export async function adminCreateCoupon(data: CreateCouponInput): Promise<Coupon> {
  return apiFetch<Coupon>('/api/admin/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function adminUpdateCoupon(id: string, data: UpdateCouponInput): Promise<Coupon> {
  return apiFetch<Coupon>(`/api/admin/coupons/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function adminDisableCoupon(id: string): Promise<void> {
  await apiFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
}
