import { apiFetch } from './index'
import type { AdminInventoryRow } from '@/lib/repositories/inventoryRepository'

export async function adminGetInventory(): Promise<AdminInventoryRow[]> {
  return apiFetch<AdminInventoryRow[]>('/api/admin/inventory')
}

export async function adminAdjustStock(variantId: string, new_stock: number, reason: 'restock' | 'adjustment'): Promise<void> {
  await apiFetch(`/api/admin/inventory/${variantId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_stock, reason }),
  })
}
