import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { addImageSchema } from '@/lib/validations/adminProductSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const POST = requireAdmin(async (request, ctx) => {
  try {
    const parts = request.url.split('/')
    const id = parts[parts.indexOf('products') + 1]
    const body = await request.json()
    const data = addImageSchema.parse(body)
    await ProductService.addImage(id, data)
    return successResponse(null, 201)
  } catch (error) {
    return errorResponse(error)
  }
})
