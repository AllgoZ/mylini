import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { HomepageService } from '@/lib/services/homepageService'
import { homepageSectionSchema, reorderSectionsSchema } from '@/lib/validations/homepageSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { revalidatePath } from 'next/cache'

export const GET = requireAdmin(async (_request, _ctx) => {
  try {
    const sections = await HomepageService.getAll()
    return successResponse(sections)
  } catch (error) {
    return errorResponse(error)
  }
})

export const POST = requireAdmin(async (request, _ctx) => {
  try {
    const body = await request.json()
    const input = homepageSectionSchema.parse(body)
    const section = await HomepageService.create(input as any)
    revalidatePath('/')
    return successResponse(section, 201)
  } catch (error) {
    return errorResponse(error)
  }
})

// PATCH /api/admin/content/sections  — bulk reorder
export const PATCH = requireAdmin(async (request, _ctx) => {
  try {
    const body = await request.json()
    const { ids } = reorderSectionsSchema.parse(body)
    await HomepageService.reorder(ids)
    revalidatePath('/')
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
