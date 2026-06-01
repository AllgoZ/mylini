import { z } from 'zod'

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  user_id: z.string().uuid('Invalid user ID'),
  order_total: z.number().positive('Order total must be greater than 0'),
})

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>
