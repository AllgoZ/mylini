import { AuthService } from '@/lib/services/authService'
import { errorResponse } from '@/lib/utils/apiResponse'
import { AppError } from '@/lib/utils/errors'
import { captureError } from '@/lib/utils/sentry'
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
        // Same { data, error, status } shape as every other route's errorResponse() —
        // was previously a hand-rolled { error, code } shape, inconsistent with the rest
        // of the API.
        return errorResponse(new AppError('Unauthorized', 401, 'SESSION_INVALID'))
      }

      return await handler(request, session)
    } catch (err: unknown) {
      captureError(err, { source: 'requireSession' })
      return errorResponse(err)
    }
  }
}
