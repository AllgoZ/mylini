import { createClient } from '@/lib/db/server'
import { AuthService } from '@/lib/services/authService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { AppError } from '@/lib/utils/errors'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = schema.parse(body)

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      throw new AppError('Admin credentials not configured on server', 500)
    }

    const emailOk = email.toLowerCase() === adminEmail.toLowerCase()
    const passwordOk = password === adminPassword

    if (!emailOk || !passwordOk) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
    }

    // Find admin user: first user who has the 'admin' role
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_roles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('user_id, role:roles!inner(name), user:users!inner(*)' as any)
      .eq('roles.name' as any, 'admin')
      .is('users.deleted_at' as any, null)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      throw new AppError('No admin user found. Run SELECT assign_admin_by_phone(\'your_phone\') in Supabase SQL Editor first.', 500)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminUser = (data as any).user
    const userAgent = request.headers.get('user-agent') ?? undefined
    const ipAddress = request.headers.get('x-forwarded-for') ?? undefined

    const session = await AuthService.createSession(adminUser.id, userAgent, ipAddress)

    const response = successResponse({ user: adminUser })
    response.headers.set(
      'Set-Cookie',
      `session=${session.session_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    )

    return response
  } catch (error) {
    return errorResponse(error)
  }
}
