import { z } from 'zod'

export const createCouponSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(1),
  minimum_order: z.number().int().min(0).optional().default(0),
  usage_limit: z.number().int().min(1).nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().optional().default(true),
})

export const updateCouponSchema = createCouponSchema.partial()

export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>
