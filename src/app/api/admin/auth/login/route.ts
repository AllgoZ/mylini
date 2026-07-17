import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { AppError } from '@/lib/utils/errors'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { captureMessage } from '@/lib/utils/sentry'
import { checkRateLimit } from '@/lib/utils/rateLimit'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Constant-time comparison — a plain `===` short-circuits on the first differing byte,
// which leaks (via response timing) how many leading characters of a guess were correct.
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function signAdminToken(email: string, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString('base64url')
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, retryAfter } = await checkRateLimit(`admin-login:${ip}`, 10, 15 * 60)
    if (!allowed) {
      throw new AppError(`Too many login attempts. Try again in ${retryAfter}s.`, 429, 'RATE_LIMITED')
    }

    const body = await request.json()
    const { email, password } = schema.parse(body)

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      throw new AppError('Admin credentials not configured on server', 500)
    }

    const emailOk = timingSafeStringEqual(email.toLowerCase(), adminEmail.toLowerCase())
    const passwordOk = timingSafeStringEqual(password, adminPassword)

    if (!emailOk || !passwordOk) {
      captureMessage(`Failed admin login attempt for ${email}`, 'warning')
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
    }

    const token = signAdminToken(email, adminPassword)

    const response = successResponse({ email })
    response.headers.set(
      'Set-Cookie',
      `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    )

    return response
  } catch (error) {
    return errorResponse(error)
  }
}
