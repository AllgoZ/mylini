import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric, and hyphens only'),
  description: z.string().max(10000).optional(),
  category_id: z.string().uuid(),
  base_price: z.number().int().min(1),
  sale_price: z.number().int().min(1).nullable().optional(),
  is_featured: z.boolean().optional().default(false),
  is_best_seller: z.boolean().optional().default(false),
  is_new_arrival: z.boolean().optional().default(false),
  status: z.enum(['draft', 'active', 'archived', 'hidden', 'scheduled']).optional().default('active'),
  meta_title: z.string().max(200).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
  weight_grams: z.number().int().min(0).nullable().optional(),
  length_cm: z.number().min(0).nullable().optional(),
  width_cm: z.number().min(0).nullable().optional(),
  height_cm: z.number().min(0).nullable().optional(),
  size_chart_url: z.string().max(1000).nullable().optional(),
  product_type: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().max(50)).optional().default([]),
  charge_tax: z.boolean().optional().default(true),
})

export const updateProductSchema = createProductSchema.partial()

export const createVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  size: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  price_override: z.number().min(0).nullable().optional(),
  compare_at_price: z.number().min(0).nullable().optional(),
  cost_per_item: z.number().min(0).nullable().optional(),
  barcode: z.string().max(100).nullable().optional(),
  is_active: z.boolean().optional().default(true),
  initial_stock: z.number().int().min(0).optional().default(0),
})

export const updateVariantSchema = createVariantSchema.omit({ initial_stock: true }).partial()

export const addImageSchema = z.object({
  public_url: z.string().url(),
  storage_key: z.string().optional(),
  storage_provider: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt_text: z.string().max(200).optional(),
  sort_order: z.number().int().min(0).optional().default(0),
  is_primary: z.boolean().optional().default(false),
})

export const updateImageSchema = z.object({
  sort_order: z.number().int().min(0).optional(),
  is_primary: z.boolean().optional(),
  alt_text: z.string().max(200).optional(),
})

export const addAttributeSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
})

export const replaceAttributesSchema = z.object({
  attributes: z.array(addAttributeSchema),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>
export type AddImageInput = z.infer<typeof addImageSchema>
export type AddAttributeInput = z.infer<typeof addAttributeSchema>
export type ReplaceAttributesInput = z.infer<typeof replaceAttributesSchema>
