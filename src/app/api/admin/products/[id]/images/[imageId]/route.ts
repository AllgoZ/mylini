import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { updateImageSchema } from '@/lib/validations/adminProductSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { extractParam } from '@/lib/utils/routeParams'

export const PATCH = requireAdmin(async (request, ctx) => {
  try {
    const imageId = extractParam(request.url, 'images')
    const body = await request.json()
    const data = updateImageSchema.parse(body)
    await ProductService.updateImage(imageId, data)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})

export const DELETE = requireAdmin(async (request, ctx) => {
  try {
    const imageId = extractParam(request.url, 'images')
    await ProductService.removeImage(imageId)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
