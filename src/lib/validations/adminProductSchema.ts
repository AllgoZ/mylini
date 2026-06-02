import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric, and hyphens only'),
  description: z.string().max(5000).optional(),
  category_id: z.string().uuid(),
  base_price: z.number().int().min(1),
  sale_price: z.number().int().min(1).nullable().optional(),
  is_featured: z.boolean().optional().default(false),
  is_best_seller: z.boolean().optional().default(false),
  is_new_arrival: z.boolean().optional().default(false),
  status: z.enum(['draft', 'active', 'archived']).optional().default('draft'),
})

export const updateProductSchema = createProductSchema.partial()

export const createVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  size: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  price_override: z.number().int().min(1).nullable().optional(),
  is_active: z.boolean().optional().default(true),
})

export const updateVariantSchema = createVariantSchema.partial()

export const addImageSchema = z.object({
  public_url: z.string().url(),
  alt_text: z.string().max(200).optional(),
  sort_order: z.number().int().min(0).optional().default(0),
  is_primary: z.boolean().optional().default(false),
})

export const updateImageSchema = z.object({
  sort_order: z.number().int().min(0).optional(),
  is_primary: z.boolean().optional(),
  alt_text: z.string().max(200).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>
export type AddImageInput = z.infer<typeof addImageSchema>
