import { z } from 'zod'

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
})

export const updateTrackingSchema = z.object({
  tracking_number: z.string().max(100).optional(),
  tracking_url: z.string().url('Must be a valid URL').max(500).optional().or(z.literal('')),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type UpdateTrackingInput = z.infer<typeof updateTrackingSchema>
