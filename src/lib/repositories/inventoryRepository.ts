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

  async findAll(): Promise<AdminInventoryRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        variant_id, stock_available, stock_reserved, low_stock_threshold,
        variant:product_variants!inner(
          id, sku, color, size, deleted_at,
          product:products!inner(id, name, slug,
            primary_image:product_images(public_url)
          )
        )
      `)
      .order('stock_available', { ascending: true })
      // Only return the primary image row from the join — avoids fetching all images client-side
      .eq('product_variants.products.product_images.is_primary', true)

    if (error) throw new Error(error.message)

    return (data ?? [])
      .filter((row: any) => !row.variant.deleted_at)
      .map((row: any) => ({
        variant_id: row.variant_id,
        stock_available: row.stock_available,
        stock_reserved: row.stock_reserved,
        low_stock_threshold: row.low_stock_threshold,
        sku: row.variant.sku,
        size: row.variant.size,
        color: row.variant.color,
        product_id: row.variant.product.id,
        product_name: row.variant.product.name,
        product_slug: row.variant.product.slug,
        primary_image: row.variant.product.primary_image?.[0]?.public_url ?? null,
      }))
  },

  async setStock(variantId: string, newStock: number): Promise<void> {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('inventory')
      .update({ stock_available: newStock })
      .eq('variant_id', variantId)

    if (error) throw new Error(error.message)
  },

  async updateSettings(variantId: string, settings: { inventory_tracked?: boolean; sell_when_out_of_stock?: boolean; low_stock_threshold?: number }): Promise<void> {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('inventory')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('variant_id', variantId)

    if (error) throw new Error(error.message)
  },
}

export type AdminInventoryRow = {
  variant_id: string
  stock_available: number
  stock_reserved: number
  low_stock_threshold: number
  sku: string
  size: string | null
  color: string | null
  product_id: string
  product_name: string
  product_slug: string
  primary_image: string | null
}
