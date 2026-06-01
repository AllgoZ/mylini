import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSummary } from '@/types/product';

export type { ProductSummary };

interface WishState {
  items: ProductSummary[];
  toggleItem: (item: ProductSummary) => void;
  hasItem: (id: string) => boolean;
}

export const useWishStore = create<WishState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (item) => {
        set((state) => {
          const exists = state.items.some((i) => i.id === item.id);
          if (exists) {
            return { items: state.items.filter((i) => i.id !== item.id) };
          } else {
            return { items: [...state.items, item] };
          }
        });
      },
      hasItem: (id) => get().items.some((i) => i.id === id),
    }),
    {
      name: 'mylini-wish-storage',
    }
  )
);
