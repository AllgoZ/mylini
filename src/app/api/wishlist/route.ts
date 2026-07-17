import { WishlistService } from '@/lib/services/wishlistService'
import { wishlistToggleSchema } from '@/lib/validations/wishlistSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { validateSessionMiddleware } from '@/lib/middleware/sessionMiddleware'
import { AppError } from '@/lib/utils/errors'
import { checkRateLimit } from '@/lib/utils/rateLimit'

export async function POST(request: Request) {
  try {
    const session = await validateSessionMiddleware(request)
    if (!session) {
      throw new AppError('Unauthorized', 401, 'SESSION_INVALID')
    }

    // Generous — abuse/DoS backstop, not brute force.
    const { allowed, retryAfter } = await checkRateLimit(`wishlist-mutate:${session.user.id}`, 60, 60)
    if (!allowed) {
      throw new AppError(`Too many requests. Try again in ${retryAfter}s.`, 429, 'RATE_LIMITED')
    }

    const body = await request.json()
    const { product_id } = wishlistToggleSchema.parse(body)
    await WishlistService.toggle(session.user.id, product_id)
    const items = await WishlistService.getItems(session.user.id)
    return successResponse(items, 201)
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

    const items = await WishlistService.getItems(session.user.id)
    return successResponse(items)
  } catch (error) {
    return errorResponse(error)
  }
}
