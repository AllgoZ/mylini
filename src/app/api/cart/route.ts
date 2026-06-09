import { CartService } from '@/lib/services/cartService'
import {
  addCartItemSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from '@/lib/validations/cartSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    if (!sessionId) return errorResponse(new Error('session_id is required'))

    const cart = await CartService.getCart(sessionId)
    return successResponse(cart)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { variant_id, quantity, session_id } = addCartItemSchema.parse(body)
    const cart = await CartService.addItem(session_id, variant_id, quantity)
    return successResponse(cart, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { variant_id, quantity, session_id } = updateCartItemSchema.parse(body)
    const cart = await CartService.updateItem(session_id, variant_id, quantity)
    return successResponse(cart)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    // If no variant_id — clear all items in the cart
    if (!body.variant_id) {
      const { session_id } = removeCartItemSchema.pick({ session_id: true }).parse(body)
      await CartService.clear(session_id)
      return successResponse(null)
    }
    const { variant_id, session_id } = removeCartItemSchema.parse(body)
    const cart = await CartService.removeItem(session_id, variant_id)
    return successResponse(cart)
  } catch (error) {
    return errorResponse(error)
  }
}
