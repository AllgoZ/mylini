import { ZodError } from 'zod'
import { AppError } from './errors'

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  status: number
}

export function successResponse<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = { data, error: null, status }
  return Response.json(body, { status })
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    const message = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
    const body: ApiResponse<null> = { data: null, error: message, status: 400 }
    return Response.json(body, { status: 400 })
  }

  if (error instanceof AppError) {
    const body: ApiResponse<null> = { data: null, error: error.message, status: error.statusCode }
    return Response.json(body, { status: error.statusCode })
  }

  console.error('[API Error]', error)
  const body: ApiResponse<null> = { data: null, error: 'Internal server error', status: 500 }
  return Response.json(body, { status: 500 })
}
