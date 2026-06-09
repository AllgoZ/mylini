import type { Database } from '@/lib/db/generated/database.types'
import type { Address } from './user'
import type { Coupon } from './coupon'

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderStatus = Database['public']['Enums']['order_status']

export type OrderWithItems = Order & {
  items: OrderItem[]
  address: Address
  coupon: Pick<Coupon, 'id' | 'code' | 'type' | 'value'> | null
}

export type CreateOrderInput = {
  user_id: string
  address_id: string
  items: {
    variant_id: string
    quantity: number
  }[]
  coupon_code?: string
  notes?: string
}

export type OrderSummary = Pick<
  Order,
  'id' | 'status' | 'subtotal' | 'discount' | 'total' | 'created_at'
> & {
  item_count: number
  items_preview: { product_name_snapshot: string; image_snapshot: string | null }[]
}

export type AdminOrderSummary = Omit<OrderSummary, 'items_preview'> & {
  items_preview?: { product_name_snapshot: string; image_snapshot: string | null }[]
}
