import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { AboutService } from '@/lib/services/aboutService'
import { updateAboutContentSchema } from '@/lib/validations/aboutSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { revalidatePath } from 'next/cache'

export const GET = requireAdmin(async (_request, _ctx) => {
  try {
    const content = await AboutService.get()
    return successResponse(content)
  } catch (error) {
    return errorResponse(error)
  }
})

export const PATCH = requireAdmin(async (request, _ctx) => {
  try {
    const body = await request.json()
    const input = updateAboutContentSchema.parse(body)
    const content = await AboutService.update(input)
    revalidatePath('/about')
    revalidatePath('/about-us')
    return successResponse(content)
  } catch (error) {
    return errorResponse(error)
  }
})
