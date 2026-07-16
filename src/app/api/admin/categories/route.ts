import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { CategoryService } from '@/lib/services/categoryService'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { revalidatePath } from 'next/cache'

const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  parent_id: z.string().uuid().optional(),
})

export const POST = requireAdmin(async (request, ctx) => {
  try {
    const body = await request.json()
    const { name, parent_id } = createCategorySchema.parse(body)
    const category = await CategoryService.create(name, parent_id)
    revalidatePath('/')
    revalidatePath('/shop/[category]', 'page')
    return successResponse(category, 201)
  } catch (error) {
    return errorResponse(error)
  }
})
