import { z } from 'zod'

const orderItemSchema = z.object({
  variant_id: z.string().uuid('Invalid variant ID'),
  quantity: z.number().int().min(1).max(99),
})

export const checkoutSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  address_id: z.string().uuid('Invalid address ID'),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  coupon_code: z.string().min(1).max(50).toUpperCase().optional(),
  notes: z.string().max(500).optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
