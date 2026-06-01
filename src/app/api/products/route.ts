import { ProductService } from '@/lib/services/productService'
import { productQuerySchema } from '@/lib/validations/productSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const filters = productQuerySchema.parse(params)
    const result = await ProductService.list(filters)
    return successResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}
