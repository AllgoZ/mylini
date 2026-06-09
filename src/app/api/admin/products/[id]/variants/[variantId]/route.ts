import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { InventoryService } from '@/lib/services/inventoryService'
import { updateVariantSchema } from '@/lib/validations/adminProductSchema'
import { updateInventorySettingsSchema } from '@/lib/validations/adminInventorySchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { extractParam } from '@/lib/utils/routeParams'

function getVariantId(url: string): string {
  return extractParam(url, 'variants')
}

export const GET = requireAdmin(async (request, ctx) => {
  try {
    const variantId = getVariantId(request.url)
    const parts = request.url.split('/')
    const productId = parts[parts.indexOf('products') + 1]

    const product = await ProductService.getByIdForAdmin(productId)
    const variant = product.variants?.find((v: any) => v.id === variantId)
    if (!variant) return Response.json({ data: null, error: 'Variant not found', status: 404 }, { status: 404 })

    const inventory = await InventoryService.getByVariantId(variantId)
    return successResponse({ ...variant, inventory })
  } catch (error) {
    return errorResponse(error)
  }
})

export const PATCH = requireAdmin(async (request, ctx) => {
  try {
    const variantId = getVariantId(request.url)
    const body = await request.json()
    const { inventory_tracked, sell_when_out_of_stock, low_stock_threshold, new_stock, reason, ...variantFields } = body

    if (Object.keys(variantFields).length > 0) {
      const data = updateVariantSchema.parse(variantFields)
      await ProductService.updateVariant(variantId, data as any)
    }

    if (inventory_tracked !== undefined || sell_when_out_of_stock !== undefined || low_stock_threshold !== undefined) {
      const settings = updateInventorySettingsSchema.parse({ inventory_tracked, sell_when_out_of_stock, low_stock_threshold })
      await InventoryService.updateSettings(variantId, settings)
    }

    if (new_stock !== undefined && reason !== undefined) {
      await InventoryService.adjustStock(variantId, Number(new_stock), reason, ctx.user.id)
    }

    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})

export const DELETE = requireAdmin(async (request, ctx) => {
  try {
    const variantId = getVariantId(request.url)
    await ProductService.deleteVariant(variantId)
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
