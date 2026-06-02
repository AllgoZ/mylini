import { AuthService } from '@/lib/services/authService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (sessionToken) {
      await AuthService.logout(sessionToken)
    }

    const response = successResponse(null)
    response.headers.set('Set-Cookie', 'session=; Path=/; Max-Age=0')
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
