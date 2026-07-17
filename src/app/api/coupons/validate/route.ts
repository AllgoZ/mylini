import { CouponService } from '@/lib/services/couponService'
import { validateCouponSchema } from '@/lib/validations/couponSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { validateSessionMiddleware } from '@/lib/middleware/sessionMiddleware'
import { AppError } from '@/lib/utils/errors'
import { checkRateLimit } from '@/lib/utils/rateLimit'

const previewSchema = validateCouponSchema.omit({ user_id: true })

export async function POST(request: Request) {
  try {
    const session = await validateSessionMiddleware(request)
    if (!session) {
      throw new AppError('Unauthorized', 401, 'SESSION_INVALID')
    }

    const { allowed, retryAfter } = await checkRateLimit(`coupon-validate:${session.user.id}`, 10, 60)
    if (!allowed) {
      throw new AppError(`Too many attempts. Try again in ${retryAfter}s.`, 429, 'RATE_LIMITED')
    }

    const body = await request.json()
    const input = previewSchema.parse(body)
    const applied = await CouponService.validate({ ...input, user_id: session.user.id })
    return successResponse(applied)
  } catch (error) {
    return errorResponse(error)
  }
}
