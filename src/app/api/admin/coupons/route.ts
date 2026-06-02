import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { CouponService } from '@/lib/services/couponService'
import { createCouponSchema } from '@/lib/validations/adminCouponSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    }
    const result = await CouponService.listAll(filters)
    return successResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
})

export const POST = requireAdmin(async (request) => {
  try {
    const body = await request.json()
    const data = createCouponSchema.parse(body)
    const coupon = await CouponService.create(data)
    return successResponse(coupon, 201)
  } catch (error) {
    return errorResponse(error)
  }
})
