import { OrderRepository } from '@/lib/repositories/orderRepository'
import { InventoryRepository } from '@/lib/repositories/inventoryRepository'
import { InventoryService } from './inventoryService'
import { CouponService } from './couponService'
import { CouponRepository } from '@/lib/repositories/couponRepository'
import { ProductRepository } from '@/lib/repositories/productRepository'
import { ValidationError } from '@/lib/utils/errors'
import type { CreateOrderInput, Order, OrderSummary } from '@/types/order'
import type { VariantSnapshot } from '@/types/product'
import type { Database } from '@/lib/db/generated/database.types'

type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

export const OrderService = {
  async create(input: CreateOrderInput): Promise<Order> {
    const { user_id, address_id, items, coupon_code, notes } = input

    if (items.length === 0) throw new ValidationError('Order must contain at least one item')

    // 1. Validate all item stock
    for (const item of items) {
      const inventory = await InventoryRepository.findByVariantId(item.variant_id)
      if (inventory.stock_available < item.quantity) {
        throw new ValidationError(`Insufficient stock for variant ${item.variant_id}`)
      }
    }

    // 2. Fetch variant snapshots via repository (no direct Supabase access in services)
    const snapshots = await ProductRepository.findVariantsByIds(items.map(i => i.variant_id))
    const variantDetails: Record<string, VariantSnapshot> = {}
    for (const snapshot of snapshots) {
      variantDetails[snapshot.id] = snapshot
    }
    for (const item of items) {
      if (!variantDetails[item.variant_id]) {
        throw new ValidationError(`Variant ${item.variant_id} not found`)
      }
    }

    // 3. Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + variantDetails[item.variant_id].price * item.quantity
    }, 0)

    // 4. Validate and apply coupon
    let discount = 0
    let couponId: string | undefined

    if (coupon_code) {
      const applied = await CouponService.validate({ code: coupon_code, user_id, order_total: subtotal })
      discount = applied.discount_amount
      couponId = applied.coupon.id
    }

    const total = subtotal - discount

    // 5. Create order record
    const order = await OrderRepository.create({
      user_id,
      address_id,
      coupon_id: couponId ?? null,
      status: 'pending',
      subtotal,
      discount,
      total,
      notes: notes ?? null,
    })

    // 6. Create order items with snapshots
    const orderItems: OrderItemInsert[] = items.map((item) => {
      const v = variantDetails[item.variant_id]
      const variantLabel = [v.color, v.size].filter(Boolean).join(' / ')
      return {
        order_id: order.id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: v.price,
        total_price: v.price * item.quantity,
        product_name_snapshot: v.productName,
        sku_snapshot: v.sku,
        variant_snapshot: variantLabel,
        image_snapshot: v.image,
      }
    })

    await OrderRepository.addItems(orderItems)

    // 7. Decrement inventory
    for (const item of items) {
      await InventoryService.decrementStock(item.variant_id, item.quantity)
    }

    // 8. Record coupon usage
    if (couponId) {
      await CouponRepository.recordUsage(couponId, user_id, order.id)
      await CouponRepository.incrementUsage(couponId)
    }

    return order
  },

  async getByUserId(userId: string): Promise<OrderSummary[]> {
    return OrderRepository.findByUserId(userId)
  },
}
