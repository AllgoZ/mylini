import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { AdminStatsService } from '@/lib/services/adminStatsService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async () => {
  try {
    const stats = await AdminStatsService.getDashboardStats()
    return successResponse(stats)
  } catch (error) {
    return errorResponse(error)
  }
})
