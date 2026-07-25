import type { Database } from '@/lib/db/generated/database.types'
import type { Address } from './user'
import type { Coupon } from './coupon'

// shipping_charge/tax_amount (migration 040) postdate the last database.types.ts
// generation — same situation as otps/rate_limits/store_settings, until types are
// regenerated against the live schema after the migration is applied.
export type Order = Database['public']['Tables']['orders']['Row'] & {
  shipping_charge: number
  tax_amount: number
}
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderStatus = Database['public']['Enums']['order_status']

export type OrderWithItems = Order & {
  // `variant` is only populated by OrderRepository.findByIdForUser — a fallback to the
  // variant's current product image for orders placed before image_snapshot was fixed
  // to actually save (older order_items rows have image_snapshot: null permanently,
  // since it's a point-in-time snapshot column).
  items: (OrderItem & { variant?: { product?: { images?: { public_url: string; is_primary: boolean }[] | null } | null } | null })[]
  address: Address
  coupon: Pick<Coupon, 'id' | 'code' | 'type' | 'value'> | null
  tracking_number?: string | null
  tracking_url?: string | null
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
  tracking_number?: string | null
  tracking_url?: string | null
}

export type AdminOrderSummary = Omit<OrderSummary, 'items_preview'> & {
  items_preview?: { product_name_snapshot: string; image_snapshot: string | null }[]
}
