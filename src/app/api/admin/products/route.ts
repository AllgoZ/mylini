import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { createProductSchema } from '@/lib/validations/adminProductSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async (request, ctx) => {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    }
    const result = await ProductService.listForAdmin(filters)
    return successResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
})

export const POST = requireAdmin(async (request, ctx) => {
  try {
    const body = await request.json()
    const data = createProductSchema.parse(body)
    const product = await ProductService.create(data as any)
    return successResponse(product, 201)
  } catch (error) {
    return errorResponse(error)
  }
})
