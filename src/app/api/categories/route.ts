import { CategoryService } from '@/lib/services/categoryService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export async function GET() {
  try {
    const categories = await CategoryService.getWithChildren()
    return successResponse(categories)
  } catch (error) {
    return errorResponse(error)
  }
}
