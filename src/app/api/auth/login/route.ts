import { AuthService } from '@/lib/services/authService'
import { CartService } from '@/lib/services/cartService'
import { loginSchema } from '@/lib/validations/authSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { cookies } from 'next/headers'

// Simple phone-only login — reverted from the OTP flow per request. Note: this has no
// possession proof (anyone who knows a phone number can log in as that user); the OTP
// infrastructure (src/lib/services/otpService.ts, migration 033) is still built and
// ready to re-wire in later if needed.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = loginSchema.parse(body)

    const userAgent = request.headers.get('user-agent') ?? undefined
    const ipAddress = request.headers.get('x-forwarded-for') ?? undefined

    const { user, session } = await AuthService.authenticateByPhone(
      phone,
      userAgent,
      ipAddress
    )

    const cookieStore = await cookies()
    const guestSessionId = cookieStore.get('session_id')?.value

    if (guestSessionId) {
      try {
        await CartService.mergeGuestCartToUser(guestSessionId, user.id)
      } catch (error) {
        console.error('Cart merge failed:', error)
      }
    }

    const response = successResponse({ user, session })
    response.headers.set(
      'Set-Cookie',
      `session=${session.session_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    )

    if (guestSessionId) {
      response.headers.append('Set-Cookie', 'session_id=; Path=/; Max-Age=0')
    }

    return response
  } catch (error) {
    return errorResponse(error)
  }
}
