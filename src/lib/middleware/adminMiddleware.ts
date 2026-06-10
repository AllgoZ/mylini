import { createHmac } from 'crypto'

export interface AdminContext {
  adminEmail: string
}

function verifyAdminToken(token: string, secret: string): string | null {
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null
    const expected = createHmac('sha256', secret).update(payload).digest('base64url')
    if (sig !== expected) return null
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

      return await handler(request, { adminEmail })
    } catch (err: unknown) {
      console.error('[requireAdmin] unhandled error:', err)
      return Response.json(
        { data: null, error: (err as Error)?.message ?? 'Internal server error', status: 500 },
        { status: 500 }
      )
    }
  }
}
