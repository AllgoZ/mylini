import { SettingsService } from '@/lib/services/settingsService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

// Public, unauthenticated — checkout/cart read shipping/tax/maintenance from here.
// SettingsService.getPublicSettings() returns an explicit field allowlist only.
export async function GET() {
  try {
    const settings = await SettingsService.getPublicSettings()
    return successResponse(settings)
  } catch (error) {
    return errorResponse(error)
  }
}
