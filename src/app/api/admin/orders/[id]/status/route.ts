import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { OrderService } from '@/lib/services/orderService'
import { updateOrderStatusSchema } from '@/lib/validations/adminOrderSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const PATCH = requireAdmin(async (request, ctx) => {
  try {
    const parts = request.url.split('/')
    const id = parts[parts.indexOf('orders') + 1]
    const body = await request.json()
    const { status } = updateOrderStatusSchema.parse(body)
    const order = await OrderService.updateStatus(id, status)
    return successResponse(order)
  } catch (error) {
    return errorResponse(error)
  }
})
