import type { Database } from '@/lib/db/generated/database.types'
import type { ProductVariant, ProductImage } from './product'

export type Cart = Database['public']['Tables']['carts']['Row']
export type CartItemRow = Database['public']['Tables']['cart_items']['Row']

// Enriched cart item with variant and product info for display
export type CartItem = CartItemRow & {
  variant: Pick<ProductVariant, 'id' | 'sku' | 'color' | 'size' | 'price_override'> & {
    product: {
      id: string
      name: string
      slug: string
      base_price: number
      sale_price: number | null
    }
    primary_image: string | null
  }
}

export type CartWithItems = Cart & {
  items: CartItem[]
  subtotal: number
  item_count: number
}

// Shape used by Zustand cart store (local state)
export type LocalCartItem = {
  id: string
  name: string
  price: number
  oldPrice?: number
  image: string
  size: string
  color?: string
  sku?: string
  variantId?: string
  quantity: number
}
