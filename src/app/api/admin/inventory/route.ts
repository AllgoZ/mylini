import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { InventoryRepository } from '@/lib/repositories/inventoryRepository'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export const GET = requireAdmin(async () => {
  try {
    const inventory = await InventoryRepository.findAll()
    return successResponse(inventory)
  } catch (error) {
    return errorResponse(error)
  }
})
