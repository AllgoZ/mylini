import { z } from 'zod'

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(150).optional(),
  image_url: z.string().max(1000).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  parent_id: z.string().uuid().nullable().optional(),
})

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
