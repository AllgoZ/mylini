import { OrderService } from '@/lib/services/orderService'
import { checkoutSchema } from '@/lib/validations/checkoutSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { validateSessionMiddleware } from '@/lib/middleware/sessionMiddleware'
import { AppError } from '@/lib/utils/errors'

export async function POST(request: Request) {
  try {
    const session = await validateSessionMiddleware(request)
    if (!session) {
      throw new AppError('Unauthorized', 401, 'SESSION_INVALID')
    }

    const body = await request.json()
    const input = checkoutSchema.parse(body)
    const order = await OrderService.create({ ...input, user_id: session.user.id })
    return successResponse(order, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(request: Request) {
  try {
    const session = await validateSessionMiddleware(request)
    if (!session) {
      throw new AppError('Unauthorized', 401, 'SESSION_INVALID')
    }

    const orders = await OrderService.getByUserId(session.user.id)
    return successResponse(orders)
  } catch (error) {
    return errorResponse(error)
  }
}
