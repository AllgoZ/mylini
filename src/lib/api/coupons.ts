import type { AppliedCoupon } from '@/types/coupon'

export async function validateCoupon(code: string, order_total: number): Promise<AppliedCoupon> {
  const res = await fetch('/api/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code, order_total }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Invalid coupon')
  return json.data as AppliedCoupon
}
