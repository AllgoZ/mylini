import { ProductService } from '@/lib/services/productService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') ?? undefined
    const metadata = await ProductService.getFilterMetadata(category)
    return successResponse(metadata)
  } catch (error) {
    return errorResponse(error)
  }
}
