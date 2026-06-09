import { AuthService } from '@/lib/services/authService'
import type { User } from '@/types/user'

export interface SessionContext {
  user: User
  sessionToken: string
}

export async function validateSessionMiddleware(request: Request): Promise<SessionContext | null> {
  const sessionToken = request.headers.get('cookie')
    ?.split(';')
    .find((c) => c.trim().startsWith('session='))
    ?.split('=')[1]

  if (!sessionToken) {
    return null
  }

  const user = await AuthService.validateSession(sessionToken)
  if (!user) {
    return null
  }

  return { user, sessionToken }
}

export function requireSession(handler: (req: Request, ctx: SessionContext) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      const session = await validateSessionMiddleware(request)

      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', code: 'SESSION_INVALID' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return await handler(request, session)
    } catch (err: any) {
      console.error('[requireSession] unhandled error:', err)
      return new Response(
        JSON.stringify({ error: err?.message ?? 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}
