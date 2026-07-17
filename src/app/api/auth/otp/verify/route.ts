import { OtpService } from '@/lib/services/otpService'
import { AuthService } from '@/lib/services/authService'
import { CartService } from '@/lib/services/cartService'
import { otpVerifySchema } from '@/lib/validations/authSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import { AppError } from '@/lib/utils/errors'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Per-IP limit on top of OTP's own per-code attempt limit — slows down scripted
    // phone-number enumeration across many different phone numbers from one source.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, retryAfter } = await checkRateLimit(`otp-verify:${ip}`, 20, 15 * 60)
    if (!allowed) {
      throw new AppError(`Too many attempts. Try again in ${retryAfter}s.`, 429, 'RATE_LIMITED')
    }

    const body = await request.json()
    const { phone, code } = otpVerifySchema.parse(body)

    await OtpService.verify(phone, code)

    const userAgent = request.headers.get('user-agent') ?? undefined
    const ipAddress = request.headers.get('x-forwarded-for') ?? undefined

    const { user, session } = await AuthService.authenticateByPhone(phone, userAgent, ipAddress)

    const cookieStore = await cookies()
    const guestSessionId = cookieStore.get('session_id')?.value

    if (guestSessionId) {
      try {
        await CartService.mergeGuestCartToUser(guestSessionId, user.id)
      } catch (error) {
        // Cart merge failure is not fatal; user is authenticated either way
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
