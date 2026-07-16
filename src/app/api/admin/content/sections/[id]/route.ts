import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { HomepageService } from '@/lib/services/homepageService'
import { updateHomepageSectionSchema } from '@/lib/validations/homepageSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { revalidatePath } from 'next/cache'

export const PATCH = requireAdmin(async (request, _ctx) => {
  try {
    const parts = request.url.split('/')
    const id = parts[parts.indexOf('sections') + 1]
    const body = await request.json()
    const input = updateHomepageSectionSchema.parse(body)
    const section = await HomepageService.update(id, input as any)
    revalidatePath('/')
    return successResponse(section)
  } catch (error) {
    return errorResponse(error)
  }
})

export const DELETE = requireAdmin(async (request, _ctx) => {
  try {
    const parts = request.url.split('/')
    const id = parts[parts.indexOf('sections') + 1]
    await HomepageService.remove(id)
    revalidatePath('/')
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
