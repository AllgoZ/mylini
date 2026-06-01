import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocalCartItem } from '@/types/cart';

// CartItem is the local Zustand shape — for DB-backed cart use CartWithItems from types/cart.ts
export type CartItem = LocalCartItem;

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.id === item.id && i.size === item.size
          );
          if (existingItemIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += item.quantity || 1;
            return { items: newItems };
          }
          return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
        });
      },
      removeItem: (id, size) => {
        set((state) => ({
          items: state.items.filter((i) => !(i.id === id && i.size === size)),
        }));
      },
      updateQuantity: (id, size, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id && i.size === size ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'mylini-cart-storage',
    }
  )
);
