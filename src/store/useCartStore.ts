'use client'

import { create } from 'zustand'
import type { CartWithItems, CartItem } from '@/types/cart'
import { cartItemPrice } from '@/types/cart'
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '@/lib/api/cart'
import { getGuestSessionId } from '@/lib/utils/guestSession'

// Data the caller already has in scope (product + selected variant) needed to render an
// optimistic cart line item immediately, before the server confirms the add. Shaped to
// match CartItem['variant'] exactly.
export interface OptimisticCartItemInput {
  variant: {
    id: string
    sku: string
    color: string | null
    size: string | null
    price_override: number | null
    inventory: { stock_available: number; low_stock_threshold: number } | null
  }
  product: {
    id: string
    name: string
    slug: string
    base_price: number
    sale_price: number | null
  }
  primary_image: string | null
}

function computeTotals(items: CartItem[]): { subtotal: number; item_count: number } {
  return {
    subtotal: items.reduce((sum, i) => sum + cartItemPrice(i) * i.quantity, 0),
    item_count: items.reduce((sum, i) => sum + i.quantity, 0),
  }
}

function buildOptimisticItem(variantId: string, quantity: number, input: OptimisticCartItemInput): CartItem {
  const now = new Date().toISOString()
  return {
    id: `optimistic-${variantId}`,
    cart_id: 'optimistic',
    variant_id: variantId,
    quantity,
    created_at: now,
    updated_at: now,
    variant: {
      id: input.variant.id,
      sku: input.variant.sku,
      color: input.variant.color,
      size: input.variant.size,
      price_override: input.variant.price_override,
      inventory: input.variant.inventory,
      product: input.product,
      primary_image: input.primary_image,
    },
  }
}

interface CartState {
  cart: CartWithItems | null
  loading: boolean
  error: string | null

  fetchCart: () => Promise<void>
  addItem: (variantId: string, quantity?: number, optimisticItem?: OptimisticCartItemInput) => Promise<void>
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

  // Optimistic when the caller passes optimisticItem (product/variant data it already has
  // in scope — see ProductDetailClient); otherwise behaves exactly as before (await, then set).
  addItem: async (variantId: string, quantity = 1, optimisticItem) => {
    set({ error: null })
    const snapshot = get().cart

    if (optimisticItem) {
      const currentItems = snapshot?.items ?? []
      const existing = currentItems.find((i) => i.variant_id === variantId)
      const nextItems = existing
        ? currentItems.map((i) =>
            i.variant_id === variantId ? { ...i, quantity: i.quantity + quantity } : i
          )
        : [...currentItems, buildOptimisticItem(variantId, quantity, optimisticItem)]

      set({
        cart: snapshot
          ? { ...snapshot, items: nextItems, ...computeTotals(nextItems) }
          : ({ id: 'optimistic', items: nextItems, ...computeTotals(nextItems) } as CartWithItems),
      })
    }

    try {
      const sessionId = getGuestSessionId()
      const cart = await addToCart(sessionId, variantId, quantity)
      set({ cart })
    } catch (e) {
      if (optimisticItem) set({ cart: snapshot })
      set({ error: e instanceof Error ? e.message : 'Failed to add item' })
      throw e
    }
  },

  updateItem: async (variantId: string, quantity: number) => {
    set({ error: null })
    const snapshot = get().cart

    if (snapshot) {
      const nextItems = snapshot.items.map((i) =>
        i.variant_id === variantId ? { ...i, quantity } : i
      )
      set({ cart: { ...snapshot, items: nextItems, ...computeTotals(nextItems) } })
    }

    try {
      const sessionId = getGuestSessionId()
      const cart = await updateCartItem(sessionId, variantId, quantity)
      set({ cart })
    } catch (e) {
      set({ cart: snapshot, error: e instanceof Error ? e.message : 'Failed to update item' })
      throw e
    }
  },

  removeItem: async (variantId: string) => {
    set({ error: null })
    const snapshot = get().cart

    if (snapshot) {
      const nextItems = snapshot.items.filter((i) => i.variant_id !== variantId)
      set({ cart: { ...snapshot, items: nextItems, ...computeTotals(nextItems) } })
    }

    try {
      const sessionId = getGuestSessionId()
      const cart = await removeCartItem(sessionId, variantId)
      set({ cart })
    } catch (e) {
      set({ cart: snapshot, error: e instanceof Error ? e.message : 'Failed to remove item' })
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
