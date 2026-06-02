import { z } from 'zod'

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
