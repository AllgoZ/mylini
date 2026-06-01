import type { Database } from '@/lib/db/generated/database.types'

export type InventoryReason = Database['public']['Enums']['inventory_reason']

export const INVENTORY_REASONS: Record<InventoryReason, string> = {
  purchase:    'Customer purchase',
  restock:     'Inventory restock',
  adjustment:  'Manual adjustment',
  cancellation: 'Order cancellation',
}
