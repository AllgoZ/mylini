import { UserRepository } from '@/lib/repositories/userRepository'
import { updateAddressSchema } from '@/lib/validations/addressSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { validateSessionMiddleware } from '@/lib/middleware/sessionMiddleware'
import { AppError } from '@/lib/utils/errors'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await validateSessionMiddleware(request)
    if (!session) throw new AppError('Unauthorized', 401, 'SESSION_INVALID')

    const { id } = await params
    const body = await request.json()
    const patch = updateAddressSchema.parse(body)
    const address = await UserRepository.updateAddress(id, session.user.id, patch)
    return successResponse(address)
  } catch (error) {
    return errorResponse(error)
  }
}
