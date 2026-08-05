import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { SettingsService } from '@/lib/services/settingsService'
import { updateStoreSettingsSchema } from '@/lib/validations/settingsSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async (_request, _ctx) => {
  try {
    const settings = await SettingsService.getForAdmin()
    return successResponse(settings)
  } catch (error) {
    return errorResponse(error)
  }
})

export const PATCH = requireAdmin(async (request, _ctx) => {
  try {
    const body = await request.json()
    const input = updateStoreSettingsSchema.parse(body)
    const settings = await SettingsService.updateSettings(input)
    return successResponse(settings)
  } catch (error) {
    return errorResponse(error)
  }
})
