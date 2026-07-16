import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { ProductService } from '@/lib/services/productService'
import { updateProductSchema } from '@/lib/validations/adminProductSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import { extractParam } from '@/lib/utils/routeParams'
import { revalidatePath } from 'next/cache'

function revalidateStorefront() {
  revalidatePath('/')
  revalidatePath('/shop/[category]', 'page')
  revalidatePath('/product/[slug]', 'page')
}

export const GET = requireAdmin(async (request, _ctx) => {
  try {
    const id = extractParam(request.url, 'products')
    const product = await ProductService.getByIdForAdmin(id)
    return successResponse(product)
  } catch (error) {
    return errorResponse(error)
  }
})

export const PATCH = requireAdmin(async (request, _ctx) => {
  try {
    const id = extractParam(request.url, 'products')
    const body = await request.json()
    const data = updateProductSchema.parse(body)
    await ProductService.update(id, data as any)
    revalidateStorefront()
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})

export const DELETE = requireAdmin(async (request, _ctx) => {
  try {
    const id = extractParam(request.url, 'products')
    await ProductService.delete(id)
    revalidateStorefront()
    return successResponse(null)
  } catch (error) {
    return errorResponse(error)
  }
})
