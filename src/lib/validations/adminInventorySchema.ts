import { z } from 'zod'

export const adjustStockSchema = z.object({
  new_stock: z.number().int().min(0),
  reason: z.enum(['restock', 'adjustment']),
})

export type AdjustStockInput = z.infer<typeof adjustStockSchema>
