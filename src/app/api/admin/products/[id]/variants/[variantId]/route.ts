import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { updateVariantSchema } from '@/lib/validations/adminProductSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

function getVariantId(url: string): string {
  return url.split('/').pop()!
}

export const PATCH = requireAdmin(async (request) => {
  try {
    const variantId = getVariantId(request.url)
    const body = await request.json()
    const data = updateVariantSchema.parse(body)
    await ProductService.updateVariant(variantId, data)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})

export const DELETE = requireAdmin(async (request) => {
  try {
    const variantId = getVariantId(request.url)
    await ProductService.deleteVariant(variantId)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
