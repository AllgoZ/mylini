import { createAdminClient } from '@/lib/db/admin'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { AppError } from '@/lib/utils/errors'
import { randomBytes } from 'crypto'
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

    // Use service role client — bypasses RLS and table permission issues
    const supabase = createAdminClient()

    // Find admin user: first user who has the 'admin' role
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

    // Create session using service role client
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: adminUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select()
      .single()

    if (sessionError) {
      throw new AppError(`Session creation failed: ${sessionError.message}`, 500)
    }

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
