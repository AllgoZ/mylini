import { z } from 'zod'

export const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be 10 digits')
    .describe('10-digit phone number'),
})

export type LoginInput = z.infer<typeof loginSchema>
