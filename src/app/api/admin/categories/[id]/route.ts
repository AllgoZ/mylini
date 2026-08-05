import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { CategoryService } from '@/lib/services/categoryService'
import { updateCategorySchema } from '@/lib/validations/categorySchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { revalidatePath } from 'next/cache'

export const PATCH = requireAdmin(async (request, _ctx) => {
  try {
    const parts = request.url.split('/')
    const id = parts[parts.indexOf('categories') + 1]
    const body = await request.json()
    const input = updateCategorySchema.parse(body)
    const category = await CategoryService.update(id, input)
    revalidatePath('/')
    revalidatePath('/shop/[category]', 'page')
    return successResponse(category)
  } catch (error) {
    return errorResponse(error)
  }
})

export const DELETE = requireAdmin(async (request, _ctx) => {
  try {
    const parts = request.url.split('/')
    const id = parts[parts.indexOf('categories') + 1]
    await CategoryService.remove(id)
    revalidatePath('/')
    revalidatePath('/shop/[category]', 'page')
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
