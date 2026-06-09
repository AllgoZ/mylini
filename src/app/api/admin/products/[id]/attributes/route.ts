import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { replaceAttributesSchema } from '@/lib/validations/adminProductSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const POST = requireAdmin(async (request, ctx) => {
  try {
    const parts = request.url.split('/')
    const id = parts[parts.indexOf('products') + 1]
    const body = await request.json()
    const { attributes } = replaceAttributesSchema.parse(body)
    await ProductService.replaceAttributes(id, attributes)
    return successResponse({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
})
