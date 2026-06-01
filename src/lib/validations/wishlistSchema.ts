import { z } from 'zod'

export const wishlistToggleSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  product_id: z.string().uuid('Invalid product ID'),
})

export type WishlistToggleInput = z.infer<typeof wishlistToggleSchema>
