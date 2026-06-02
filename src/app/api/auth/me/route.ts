import { AuthService } from '@/lib/services/authService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return successResponse(null)
    }

    const user = await AuthService.validateSession(sessionToken)
    return successResponse(user)
  } catch (error) {
    return errorResponse(error)
  }
}
