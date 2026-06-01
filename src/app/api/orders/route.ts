import { OrderService } from '@/lib/services/orderService'
import { checkoutSchema } from '@/lib/validations/checkoutSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = checkoutSchema.parse(body)
    const order = await OrderService.create(input)
    return successResponse(order, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
