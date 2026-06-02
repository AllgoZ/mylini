import { z } from 'zod'

export const wishlistToggleSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
})

export type WishlistToggleInput = z.infer<typeof wishlistToggleSchema>
