import { OrderService } from '@/lib/services/orderService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { validateSessionMiddleware } from '@/lib/middleware/sessionMiddleware'
import { AppError } from '@/lib/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await validateSessionMiddleware(request)
    if (!session) throw new AppError('Unauthorized', 401, 'SESSION_INVALID')

    const { id } = await params
    const order = await OrderService.getByIdForUser(id, session.user.id)
    return successResponse(order)
  } catch (error) {
    return errorResponse(error)
  }
}
