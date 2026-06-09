import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { InventoryService } from '@/lib/services/inventoryService'
import { adjustStockSchema } from '@/lib/validations/adminInventorySchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { extractParam } from '@/lib/utils/routeParams'

export const PATCH = requireAdmin(async (request, ctx) => {
  try {
    const variantId = extractParam(request.url, 'inventory')
    const body = await request.json()
    const { new_stock, reason } = adjustStockSchema.parse(body)
    await InventoryService.adjustStock(variantId, new_stock, reason, ctx.user.id)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
