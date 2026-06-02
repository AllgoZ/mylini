import { WishlistService } from '@/lib/services/wishlistService'
import { wishlistToggleSchema } from '@/lib/validations/wishlistSchema'
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
    const { product_id } = wishlistToggleSchema.parse(body)
    const result = await WishlistService.toggle(session.user.id, product_id)
    return successResponse(result, 201)
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
