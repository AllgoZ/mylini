import { ProductService } from '@/lib/services/productService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const product = await ProductService.getBySlug(slug)
    return successResponse(product)
  } catch (error) {
    return errorResponse(error)
  }
}
