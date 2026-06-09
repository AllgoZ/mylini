import { InventoryRepository } from '@/lib/repositories/inventoryRepository'
import { InsufficientStockError } from '@/lib/utils/errors'

export const InventoryService = {
  async checkStock(variantId: string, requested: number): Promise<boolean> {
    const inventory = await InventoryRepository.findByVariantId(variantId)
    return inventory.stock_available >= requested
  },

  async assertStock(variantId: string, requested: number, sku: string): Promise<void> {
    const hasStock = await this.checkStock(variantId, requested)
    if (!hasStock) throw new InsufficientStockError(sku)
  },

  async isLowStock(variantId: string): Promise<boolean> {
    const inventory = await InventoryRepository.findByVariantId(variantId)
    return inventory.stock_available <= inventory.low_stock_threshold
  },

  async decrementStock(variantId: string, quantity: number): Promise<void> {
    const before = await InventoryRepository.findByVariantId(variantId)
    await InventoryRepository.decrementStock(variantId, quantity)
    await InventoryRepository.logChange(
      variantId,
      before.stock_available,
      before.stock_available - quantity,
      'purchase'
    )
  },

  async reserveStock(variantId: string, quantity: number): Promise<void> {
    const before = await InventoryRepository.findByVariantId(variantId)
    await InventoryRepository.reserveStock(variantId, quantity)
    await InventoryRepository.logChange(
      variantId,
      before.stock_available,
      before.stock_available - quantity,
      'purchase'
    )
  },

  async releaseStock(variantId: string, quantity: number): Promise<void> {
    const before = await InventoryRepository.findByVariantId(variantId)
    await InventoryRepository.releaseStock(variantId, quantity)
    await InventoryRepository.logChange(
      variantId,
      before.stock_available,
      before.stock_available + quantity,
      'cancellation'
    )
  },

  async adjustStock(variantId: string, newStock: number, reason: 'restock' | 'adjustment', adminUserId: string): Promise<void> {
    const before = await InventoryRepository.findByVariantId(variantId)
    await InventoryRepository.setStock(variantId, newStock)
    await InventoryRepository.logChange(variantId, before.stock_available, newStock, reason, adminUserId)
  },

  async updateSettings(variantId: string, settings: { inventory_tracked?: boolean; sell_when_out_of_stock?: boolean; low_stock_threshold?: number }): Promise<void> {
    return InventoryRepository.updateSettings(variantId, settings)
  },

  async getByVariantId(variantId: string) {
    return InventoryRepository.findByVariantId(variantId)
  },
}
