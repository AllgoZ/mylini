import { WishlistRepository } from '@/lib/repositories/wishlistRepository'
import type { ProductSummary } from '@/types/product'

export const WishlistService = {
  async getItems(userId: string): Promise<ProductSummary[]> {
    const wishlist = await WishlistRepository.findOrCreateByUserId(userId)
    return WishlistRepository.getItems(wishlist.id)
  },

  async toggle(userId: string, productId: string): Promise<{ added: boolean }> {
    const wishlist = await WishlistRepository.findOrCreateByUserId(userId)
    const has = await WishlistRepository.hasItem(wishlist.id, productId)

    if (has) {
      await WishlistRepository.removeItem(wishlist.id, productId)
      return { added: false }
    } else {
      await WishlistRepository.addItem(wishlist.id, productId)
      return { added: true }
    }
  },
}
