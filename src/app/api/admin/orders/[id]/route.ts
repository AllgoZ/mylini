import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { OrderService } from '@/lib/services/orderService'
import { updateTrackingSchema } from '@/lib/validations/adminOrderSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async (request, ctx) => {
  try {
    const id = request.url.split('/').at(-1)!
    const order = await OrderService.getById(id)
    return successResponse(order)
  } catch (error) {
    return errorResponse(error)
  }
})

export const PATCH = requireAdmin(async (request, ctx) => {
  try {
    const id = request.url.split('/').at(-1)!
    const body = await request.json()
    const { tracking_number, tracking_url } = updateTrackingSchema.parse(body)
    const order = await OrderService.updateTracking(
      id,
      tracking_number ?? null,
      tracking_url || null,
    )
    return successResponse(order)
  } catch (error) {
    return errorResponse(error)
  }
})
