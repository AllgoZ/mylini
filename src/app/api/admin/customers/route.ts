import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { UserRepository } from '@/lib/repositories/userRepository'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    }
    const result = await UserRepository.findAll(filters)
    return successResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
})
