'use client'

import { create } from 'zustand'
import type { ProductSummary } from '@/types/product'
import { getWishlist, toggleWishlistItem } from '@/lib/api/wishlist'
import { useAuthStore } from '@/store/useAuthStore'

interface WishState {
  items: ProductSummary[]
  productIds: Set<string>
  loading: boolean

  fetchWishlist: () => Promise<void>
  toggleItem: (product: ProductSummary) => Promise<void>
  hasItem: (id: string) => boolean
}

export const useWishStore = create<WishState>((set, get) => ({
  items: [],
  productIds: new Set(),
  loading: false,

  fetchWishlist: async () => {
    set({ loading: true })
    try {
      const items = await getWishlist()
      set({ items, productIds: new Set(items.map((i) => i.id)), loading: false })
    } catch {
      set({ loading: false })
    }
  },

  toggleItem: async (product: ProductSummary) => {
    const { isAuthenticated, openLoginModal } = useAuthStore.getState()

    if (!isAuthenticated) {
      openLoginModal(() => get().toggleItem(product))
      return
    }

    // Optimistic update
    const already = get().productIds.has(product.id)
    if (already) {
      set((s) => {
        const ids = new Set(s.productIds)
        ids.delete(product.id)
        return { items: s.items.filter((i) => i.id !== product.id), productIds: ids }
      })
    } else {
      set((s) => {
        const ids = new Set(s.productIds)
        ids.add(product.id)
        return { items: [...s.items, product], productIds: ids }
      })
    }

    try {
      const updated = await toggleWishlistItem(product.id)
      set({ items: updated, productIds: new Set(updated.map((i) => i.id)) })
    } catch {
      // Rollback on error
      if (already) {
        set((s) => {
          const ids = new Set(s.productIds)
          ids.add(product.id)
          return { items: [...s.items, product], productIds: ids }
        })
      } else {
        set((s) => {
          const ids = new Set(s.productIds)
          ids.delete(product.id)
          return { items: s.items.filter((i) => i.id !== product.id), productIds: ids }
        })
      }
    }
  },

  hasItem: (id: string) => get().productIds.has(id),
}))

// Re-export ProductSummary so existing imports of `useWishStore` still work
export type { ProductSummary }
