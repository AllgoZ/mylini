import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { OrderService } from '@/lib/services/orderService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async (request) => {
  try {
    const id = request.url.split('/').at(-1)!
    const order = await OrderService.getById(id)
    return successResponse(order)
  } catch (error) {
    return errorResponse(error)
  }
})
