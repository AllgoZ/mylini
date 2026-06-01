import { createClient } from '@/lib/db/server'
import { NotFoundError } from '@/lib/utils/errors'
import type { InventoryReason } from '@/lib/constants/inventoryReasons'
import type { Database } from '@/lib/db/generated/database.types'

type Inventory = Database['public']['Tables']['inventory']['Row']

export const InventoryRepository = {
  async findByVariantId(variantId: string): Promise<Inventory> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('variant_id', variantId)
      .single()

    if (error || !data) throw new NotFoundError(`Inventory for variant '${variantId}'`)
    return data
  },

  async decrementStock(variantId: string, quantity: number): Promise<void> {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('decrement_stock', { p_variant_id: variantId, p_quantity: quantity })
    if (error) throw new Error(error.message)
  },

  async reserveStock(variantId: string, quantity: number): Promise<void> {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('reserve_stock', { p_variant_id: variantId, p_quantity: quantity })
    if (error) throw new Error(error.message)
  },

  async releaseStock(variantId: string, quantity: number): Promise<void> {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('release_stock', { p_variant_id: variantId, p_quantity: quantity })
    if (error) throw new Error(error.message)
  },

  async logChange(
    variantId: string,
    oldStock: number,
    newStock: number,
    reason: InventoryReason,
    createdBy?: string
  ): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('inventory_logs').insert({
      variant_id: variantId,
      old_stock: oldStock,
      new_stock: newStock,
      reason,
      created_by: createdBy ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    if (error) throw new Error(error.message)
  },
}
