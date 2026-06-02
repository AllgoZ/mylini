import { AuthService } from '@/lib/services/authService'
import { CartService } from '@/lib/services/cartService'
import { loginSchema } from '@/lib/validations/authSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = loginSchema.parse(body)

    // Get user agent and IP for session tracking
    const userAgent = request.headers.get('user-agent') ?? undefined
    const ipAddress = request.headers.get('x-forwarded-for') ?? undefined

    // Authenticate by phone (creates user if missing)
    const { user, session } = await AuthService.authenticateByPhone(
      phone,
      userAgent,
      ipAddress
    )

    // Get guest session ID from cookie (if any)
    const cookieStore = await cookies()
    const guestSessionId = cookieStore.get('session_id')?.value

    // Merge guest cart into user cart
    if (guestSessionId) {
      try {
        await CartService.mergeGuestCartToUser(guestSessionId, user.id)
      } catch (error) {
        // Cart merge failure is not fatal; user is authenticated either way
        console.error('Cart merge failed:', error)
      }
    }

    // Set session cookie (httpOnly)
    const response = successResponse({ user, session })
    response.headers.set(
      'Set-Cookie',
      `session=${session.session_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    )

    // Clear guest session ID cookie
    if (guestSessionId) {
      response.headers.append(
        'Set-Cookie',
        'session_id=; Path=/; Max-Age=0'
      )
    }

    return response
  } catch (error) {
    return errorResponse(error)
  }
}
