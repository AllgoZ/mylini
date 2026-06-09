'use client'

import { create } from 'zustand'
import type { CartWithItems } from '@/types/cart'
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '@/lib/api/cart'
import { getGuestSessionId } from '@/lib/utils/guestSession'

interface CartState {
  cart: CartWithItems | null
  loading: boolean
  error: string | null

  fetchCart: () => Promise<void>
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (variantId: string, quantity: number) => Promise<void>
  removeItem: (variantId: string) => Promise<void>
  clearCart: () => Promise<void>
  getItemCount: () => number
  getSubtotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true, error: null })
    try {
      const sessionId = getGuestSessionId()
      const cart = await getCart(sessionId)
      set({ cart, loading: false })
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to load cart' })
    }
  },

  addItem: async (variantId: string, quantity = 1) => {
    set({ error: null })
    try {
      const sessionId = getGuestSessionId()
      const cart = await addToCart(sessionId, variantId, quantity)
      set({ cart })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to add item' })
      throw e
    }
  },

  updateItem: async (variantId: string, quantity: number) => {
    set({ error: null })
    try {
      const sessionId = getGuestSessionId()
      const cart = await updateCartItem(sessionId, variantId, quantity)
      set({ cart })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to update item' })
      throw e
    }
  },

  removeItem: async (variantId: string) => {
    set({ error: null })
    try {
      const sessionId = getGuestSessionId()
      const cart = await removeCartItem(sessionId, variantId)
      set({ cart })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to remove item' })
      throw e
    }
  },

  clearCart: async () => {
    set({ error: null })
    try {
      const sessionId = getGuestSessionId()
      await clearCart(sessionId)
      set({ cart: null })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to clear cart' })
      throw e
    }
  },

  getItemCount: () => {
    return get().cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
  },

  getSubtotal: () => {
    return get().cart?.subtotal ?? 0
  },
}))
