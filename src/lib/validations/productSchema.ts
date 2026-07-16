import { z } from 'zod'

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().min(1).max(200).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional().default('active'),
  featured: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
  newArrival: z.coerce.boolean().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'popular']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  // Storefront filter params
  size: z.string().optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  product_type: z.string().optional(),
  tag: z.string().optional(),
  exclude: z.string().uuid().optional(),
})

export type ProductQueryInput = z.infer<typeof productQuerySchema>
