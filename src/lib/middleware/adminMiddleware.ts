import { createHmac, timingSafeEqual } from 'node:crypto'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import { logAuditEvent } from '@/lib/utils/auditLog'
import { captureError } from '@/lib/utils/sentry'

export interface AdminContext {
  adminEmail: string
}

// Exported so src/middleware.ts can reuse the exact same verification logic for
// server-side route protection instead of a second, parallel implementation.
export function verifyAdminToken(token: string, secret: string): string | null {
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null
    const expected = createHmac('sha256', secret).update(payload).digest('base64url')
    // Constant-time — a plain !== leaks (via timing) how much of the signature matched.
    const sigBuf = Buffer.from(sig)
    const expectedBuf = Buffer.from(expected)
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null
    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (exp < Date.now()) return null
    return email as string
  } catch {
    return null
  }
}

export function requireAdmin(
  handler: (req: Request, ctx: AdminContext) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const adminPassword = process.env.ADMIN_PASSWORD
      if (!adminPassword) {
        return Response.json(
          { data: null, error: 'Admin credentials not configured on server', status: 500 },
          { status: 500 }
        )
      }

      const token = request.headers.get('cookie')
        ?.split(';')
        .find((c) => c.trim().startsWith('admin_token='))
        ?.split('=')
        .slice(1)
        .join('=')
        .trim()

      if (!token) {
        return Response.json(
          { data: null, error: 'Unauthorized', status: 401 },
          { status: 401 }
        )
      }

      const adminEmail = verifyAdminToken(token, adminPassword)
      if (!adminEmail) {
        return Response.json(
          { data: null, error: 'Unauthorized', status: 401 },
          { status: 401 }
        )
      }

      // Generous — internal-tooling backstop against a compromised/runaway admin client,
      // not a brute-force concern (the token is already verified at this point).
      const { allowed, retryAfter } = await checkRateLimit(`admin-api:${adminEmail}`, 300, 60)
      if (!allowed) {
        return Response.json(
          { data: null, error: `Too many requests. Try again in ${retryAfter}s.`, status: 429 },
          { status: 429 }
        )
      }

      logAuditEvent({ action: 'admin_access', resource: new URL(request.url).pathname, performed_by: adminEmail })

      return await handler(request, { adminEmail })
    } catch (err: unknown) {
      captureError(err, { source: 'requireAdmin' })
      return Response.json(
        { data: null, error: (err as Error)?.message ?? 'Internal server error', status: 500 },
        { status: 500 }
      )
    }
  }
}
