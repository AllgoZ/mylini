import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { SettingsService } from '@/lib/services/settingsService'
import { changeAdminCredentialsSchema } from '@/lib/validations/settingsSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { signAdminToken } from '@/app/api/admin/auth/login/route'

export const POST = requireAdmin(async (request, ctx) => {
  try {
    const body = await request.json()
    const input = changeAdminCredentialsSchema.parse(body)
    await SettingsService.changeAdminCredentials(input)

    // Re-issue the session cookie so the admin who just changed their own credentials
    // isn't logged out — same signing secret as always (ADMIN_PASSWORD env var, never
    // the credential that just changed), just a fresh token reflecting the new email
    // if one was set.
    const adminPassword = process.env.ADMIN_PASSWORD!
    const effectiveEmail = input.new_email ?? ctx.adminEmail
    const token = signAdminToken(effectiveEmail, adminPassword)

    const response = successResponse({ email: effectiveEmail })
    response.headers.set(
      'Set-Cookie',
      `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    )
    return response
  } catch (error) {
    return errorResponse(error)
  }
})
