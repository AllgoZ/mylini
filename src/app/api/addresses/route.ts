import { requireSession } from '@/lib/middleware/sessionMiddleware'
import { UserRepository } from '@/lib/repositories/userRepository'
import { addressSchema } from '@/lib/validations/addressSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireSession(async (_request, ctx) => {
  try {
    const addresses = await UserRepository.findAddressesByUserId(ctx.user.id)
    return successResponse(addresses)
  } catch (error) {
    return errorResponse(error)
  }
})

export const POST = requireSession(async (request, ctx) => {
  try {
    const body = await request.json()
    const input = addressSchema.parse({ ...body, user_id: ctx.user.id })
    const address = await UserRepository.createAddress(input)
    return successResponse(address, 201)
  } catch (error) {
    return errorResponse(error)
  }
})
