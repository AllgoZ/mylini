import { CartRepository } from '@/lib/repositories/cartRepository'
import { InventoryRepository } from '@/lib/repositories/inventoryRepository'
import { InsufficientStockError } from '@/lib/utils/errors'
import type { CartWithItems } from '@/types/cart'

export const CartService = {
  async getCart(sessionId: string): Promise<CartWithItems> {
    const cart = await CartRepository.findOrCreateBySession(sessionId)
    return CartRepository.getWithItems(cart.id)
  },

  async addItem(sessionId: string, variantId: string, quantity: number): Promise<CartWithItems> {
    const inventory = await InventoryRepository.findByVariantId(variantId)
    if (inventory.stock_available < quantity) {
      throw new InsufficientStockError(variantId)
    }

    const cart = await CartRepository.findOrCreateBySession(sessionId)

    // If the item already exists in cart, check combined quantity against stock
    const withItems = await CartRepository.getWithItems(cart.id)
    const existing = withItems.items.find((i) => i.variant_id === variantId)
    const totalQty = (existing?.quantity ?? 0) + quantity

    if (inventory.stock_available < totalQty) {
      throw new InsufficientStockError(variantId)
    }

    if (existing) {
      await CartRepository.updateItem(cart.id, variantId, totalQty)
    } else {
      await CartRepository.addItem(cart.id, variantId, quantity)
    }

    return CartRepository.getWithItems(cart.id)
  },

  async updateItem(sessionId: string, variantId: string, quantity: number): Promise<CartWithItems> {
    const inventory = await InventoryRepository.findByVariantId(variantId)
    if (inventory.stock_available < quantity) {
      throw new InsufficientStockError(variantId)
    }

    const cart = await CartRepository.findOrCreateBySession(sessionId)
    await CartRepository.updateItem(cart.id, variantId, quantity)
    return CartRepository.getWithItems(cart.id)
  },

  async removeItem(sessionId: string, variantId: string): Promise<CartWithItems> {
    const cart = await CartRepository.findOrCreateBySession(sessionId)
    await CartRepository.removeItem(cart.id, variantId)
    return CartRepository.getWithItems(cart.id)
  },
}
