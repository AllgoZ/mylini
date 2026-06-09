import { validateSessionMiddleware, type SessionContext } from './sessionMiddleware'
import { UserRepository } from '@/lib/repositories/userRepository'

export interface AdminContext extends SessionContext {}

export function requireAdmin(
  handler: (req: Request, ctx: AdminContext) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const session = await validateSessionMiddleware(request)

      if (!session) {
        return Response.json(
          { data: null, error: 'Unauthorized', status: 401 },
          { status: 401 }
        )
      }

      const isAdmin = await UserRepository.isAdmin(session.user.id)

      if (!isAdmin) {
        return Response.json(
          { data: null, error: 'Forbidden: admin access required', status: 403 },
          { status: 403 }
        )
      }

      return await handler(request, session)
    } catch (err: any) {
      console.error('[requireAdmin] unhandled error:', err)
      return Response.json(
        { data: null, error: err?.message ?? 'Internal server error', status: 500 },
        { status: 500 }
      )
    }
  }
}
