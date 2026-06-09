import { z } from 'zod'

export const adjustStockSchema = z.object({
  new_stock: z.number().int().min(0),
  reason: z.enum(['restock', 'adjustment']),
})

export const updateInventorySettingsSchema = z.object({
  inventory_tracked: z.boolean().optional(),
  sell_when_out_of_stock: z.boolean().optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
})

export type AdjustStockInput = z.infer<typeof adjustStockSchema>
export type UpdateInventorySettingsInput = z.infer<typeof updateInventorySettingsSchema>
