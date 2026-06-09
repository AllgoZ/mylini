import { z } from 'zod'

export const homepageSectionSchema = z.object({
  section_type: z.enum(['banner', 'promo_block', 'featured_category']),
  title: z.string().max(200).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  body_text: z.string().max(1000).nullable().optional(),
  image_url: z.string().max(1000).nullable().optional(),
  link_url: z.string().max(500).nullable().optional(),
  link_text: z.string().max(100).nullable().optional(),
  badge_text: z.string().max(100).nullable().optional(),
  sort_order: z.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

export const updateHomepageSectionSchema = homepageSectionSchema.partial()

export const reorderSectionsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
})
