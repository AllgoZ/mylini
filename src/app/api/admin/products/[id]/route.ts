import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { updateProductSchema } from '@/lib/validations/adminProductSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async (request, _ctx) => {
  try {
    const id = request.url.split('/').pop()!
    const product = await ProductService.getByIdForAdmin(id)
    return successResponse(product)
  } catch (error) {
    return errorResponse(error)
  }
})

export const PATCH = requireAdmin(async (request, _ctx) => {
  try {
    const id = request.url.split('/').pop()!
    const body = await request.json()
    const data = updateProductSchema.parse(body)
    await ProductService.update(id, data)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})

export const DELETE = requireAdmin(async (request, _ctx) => {
  try {
    const id = request.url.split('/').pop()!
    await ProductService.delete(id)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
