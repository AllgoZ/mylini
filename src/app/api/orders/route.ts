import { OrderService } from '@/lib/services/orderService'
import { checkoutSchema } from '@/lib/validations/checkoutSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { validateSessionMiddleware } from '@/lib/middleware/sessionMiddleware'
import { AppError } from '@/lib/utils/errors'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import { captureMessage } from '@/lib/utils/sentry'

export async function POST(request: Request) {
  try {
    const session = await validateSessionMiddleware(request)
    if (!session) {
      throw new AppError('Unauthorized', 401, 'SESSION_INVALID')
    }

    // Abuse/DoS backstop, not a brute-force concern — checkout is already gated by a
    // valid session and real stock/coupon checks.
    const { allowed, retryAfter } = await checkRateLimit(`checkout:${session.user.id}`, 10, 60)
    if (!allowed) {
      throw new AppError(`Too many checkout attempts. Try again in ${retryAfter}s.`, 429, 'RATE_LIMITED')
    }

    const body = await request.json()
    const input = checkoutSchema.parse(body)
    const order = await OrderService.create({ ...input, user_id: session.user.id })
    return successResponse(order, 201)
  } catch (error) {
    // Business-rule checkout failures (stock/coupon) are AppErrors — the generic
    // errorResponse() backstop only logs truly unexpected errors, so log these
    // separately: worth tracking in aggregate even though they're "expected".
    if (error instanceof AppError) {
      captureMessage(`Checkout failed: ${error.message}`, 'warning')
    }
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
