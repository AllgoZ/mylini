import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { CouponService } from '@/lib/services/couponService'
import { updateCouponSchema } from '@/lib/validations/adminCouponSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { extractParam } from '@/lib/utils/routeParams'

export const PATCH = requireAdmin(async (request, ctx) => {
  try {
    const id = extractParam(request.url, 'coupons')
    const body = await request.json()
    const data = updateCouponSchema.parse(body)
    const coupon = await CouponService.update(id, data)
    return successResponse(coupon)
  } catch (error) {
    return errorResponse(error)
  }
})

export const DELETE = requireAdmin(async (request, ctx) => {
  try {
    const id = extractParam(request.url, 'coupons')
    await CouponService.disable(id)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
