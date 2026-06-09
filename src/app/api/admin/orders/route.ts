import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { OrderService } from '@/lib/services/orderService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async (request, ctx) => {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    }
    const result = await OrderService.getAll(filters)
    return successResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
})
