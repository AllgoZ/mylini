import { z } from 'zod'

export const addressSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  name: z.string().min(2).max(100),
  line1: z.string().min(5).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().max(100).optional().default('India'),
  is_default: z.boolean().optional().default(false),
})

export type AddressInput = z.infer<typeof addressSchema>
