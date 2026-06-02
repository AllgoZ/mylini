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

  async mergeGuestCartToUser(guestSessionId: string, userId: string): Promise<CartWithItems> {
    // Get guest cart
    const guestCart = await CartRepository.findOrCreateBySession(guestSessionId)
    const guestWithItems = await CartRepository.getWithItems(guestCart.id)

    // Get or create user cart
    const userCart = await CartRepository.findByUserId(userId) ||
      await CartRepository.findOrCreateBySession(userId) // Fallback: create temp, will be replaced

    // For each item in guest cart
    for (const item of guestWithItems.items) {
      // Check inventory
      const inventory = await InventoryRepository.findByVariantId(item.variant_id)
      if (inventory.stock_available < item.quantity) {
        // Skip items that exceed stock (partial merge)
        continue
      }

      // Try to find existing item in user cart
      const userWithItems = await CartRepository.getWithItems(userCart.id)
      const existingUserItem = userWithItems.items.find((i) => i.variant_id === item.variant_id)

      if (existingUserItem) {
        // Merge quantities
        const mergedQty = existingUserItem.quantity + item.quantity
        if (inventory.stock_available >= mergedQty) {
          await CartRepository.updateItem(userCart.id, item.variant_id, mergedQty)
        }
      } else {
        // Add new item to user cart
        await CartRepository.addItem(userCart.id, item.variant_id, item.quantity)
      }
    }

    // Clear guest cart
    await CartRepository.clearCart(guestCart.id)

    return CartRepository.getWithItems(userCart.id)
  },
}
