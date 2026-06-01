import { z } from 'zod'

export const addCartItemSchema = z.object({
  variant_id: z.string().uuid('Invalid variant ID'),
  quantity: z.number().int().min(1).max(99),
  session_id: z.string().min(1, 'Session ID is required'),
})

export const updateCartItemSchema = z.object({
  variant_id: z.string().uuid('Invalid variant ID'),
  quantity: z.number().int().min(1).max(99),
  session_id: z.string().min(1, 'Session ID is required'),
})

export const removeCartItemSchema = z.object({
  variant_id: z.string().uuid('Invalid variant ID'),
  session_id: z.string().min(1, 'Session ID is required'),
})

export type AddCartItemInput = z.infer<typeof addCartItemSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>
