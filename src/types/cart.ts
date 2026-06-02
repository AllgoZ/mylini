import type { Database } from '@/lib/db/generated/database.types'
import type { ProductVariant } from './product'

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

// Effective price helper — mirrors CartRepository computation
export function cartItemPrice(item: CartItem): number {
  return item.variant.price_override ?? item.variant.product.sale_price ?? item.variant.product.base_price
}

export type CartWithItems = Cart & {
  items: CartItem[]
  subtotal: number
  item_count: number
}
