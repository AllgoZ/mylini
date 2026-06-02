import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { createVariantSchema } from '@/lib/validations/adminProductSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const POST = requireAdmin(async (request) => {
  try {
    const parts = request.url.split('/')
    const id = parts[parts.indexOf('products') + 1]
    const body = await request.json()
    const data = createVariantSchema.parse(body)
    const { price_override, ...rest } = data
    const variant = await ProductService.addVariant(id, {
      ...rest,
      price_override: price_override ?? undefined,
    })
    return successResponse(variant, 201)
  } catch (error) {
    return errorResponse(error)
  }
})
