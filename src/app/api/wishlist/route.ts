import { WishlistService } from '@/lib/services/wishlistService'
import { wishlistToggleSchema } from '@/lib/validations/wishlistSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, product_id } = wishlistToggleSchema.parse(body)
    const result = await WishlistService.toggle(user_id, product_id)
    return successResponse(result, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    if (!user_id) return errorResponse(new Error('user_id is required'))

    const items = await WishlistService.getItems(user_id)
    return successResponse(items)
  } catch (error) {
    return errorResponse(error)
  }
}
