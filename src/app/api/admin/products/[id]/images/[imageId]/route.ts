import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { updateImageSchema } from '@/lib/validations/adminProductSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

function getImageId(url: string): string {
  return url.split('/').pop()!
}

export const PATCH = requireAdmin(async (request) => {
  try {
    const imageId = getImageId(request.url)
    const body = await request.json()
    const data = updateImageSchema.parse(body)
    await ProductService.updateImage(imageId, data)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})

export const DELETE = requireAdmin(async (request) => {
  try {
    const imageId = getImageId(request.url)
    await ProductService.removeImage(imageId)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
