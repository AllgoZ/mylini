import { OrderRepository, type AdminOrderRow } from '@/lib/repositories/orderRepository'
import { CouponService } from './couponService'
import { ProductRepository } from '@/lib/repositories/productRepository'
import { UserRepository } from '@/lib/repositories/userRepository'
import { SettingsRepository } from '@/lib/repositories/settingsRepository'
import { sendOrderPlacedNotification } from '@/lib/integrations/resend/client'
import { captureError } from '@/lib/utils/sentry'
import { AppError, ValidationError } from '@/lib/utils/errors'
import type { CreateOrderInput, Order, OrderSummary, OrderStatus, OrderWithItems } from '@/types/order'
import type { VariantSnapshot } from '@/types/product'

export const OrderService = {
  async create(input: CreateOrderInput): Promise<Order> {
    const { user_id, address_id, items, coupon_code, notes } = input

    if (items.length === 0) throw new ValidationError('Order must contain at least one item')

    // 1. Fetch variant snapshots via repository (no direct Supabase access in services)
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

    // 2. Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + variantDetails[item.variant_id].price * item.quantity
    }, 0)

    // 3. Validate and apply coupon
    let discount = 0
    let couponId: string | undefined

    if (coupon_code) {
      const applied = await CouponService.validate({ code: coupon_code, user_id, order_total: subtotal })
      discount = applied.discount_amount
      couponId = applied.coupon.id
    }

    const total = subtotal - discount

    // 4. Build order item snapshots
    const orderItems = items.map((item) => {
      const v = variantDetails[item.variant_id]
      const variantLabel = [v.color, v.size].filter(Boolean).join(' / ')
      return {
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

    // 5. Create order + items + decrement stock + record coupon usage, atomically —
    // stock validation, race-condition guarding, and rollback-on-failure all happen
    // inside create_order_transactional (migration 030) instead of a sequence of
    // separate round trips here.
    const order = await OrderRepository.createTransactional({
      user_id,
      address_id,
      coupon_id: couponId ?? null,
      subtotal,
      discount,
      total,
      notes: notes ?? null,
      items: orderItems,
    })

    // 6. Notify the store owner (ORDER_NOTIFICATION_EMAIL) that a new order came in. The
    // order is already committed above — awaited so it isn't dropped by a serverless
    // function freezing post-response, but any failure here must never fail checkout.
    try {
      const [fullOrder, customer, settings] = await Promise.all([
        OrderRepository.findById(order.id),
        UserRepository.findById(user_id),
        SettingsRepository.getSettings().catch(() => null),
      ])
      await sendOrderPlacedNotification({
        orderId: fullOrder.id,
        subtotal: fullOrder.subtotal,
        discount: fullOrder.discount,
        total: fullOrder.total,
        customerName: customer?.name ?? null,
        customerPhone: customer?.phone ?? '',
        customerEmail: customer?.email ?? null,
        address: fullOrder.address,
        items: fullOrder.items.map((item) => ({
          productName: item.product_name_snapshot,
          variant: item.variant_snapshot,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
        })),
      }, settings?.order_notification_email)
    } catch (err) {
      captureError(err, { source: 'OrderService.create.notify', orderId: order.id })
    }

    return order
  },

  async getByUserId(userId: string): Promise<OrderSummary[]> {
    return OrderRepository.findByUserId(userId)
  },

  async getAll(filters: { status?: string; page?: number; limit?: number }): Promise<{ orders: AdminOrderRow[]; count: number }> {
    return OrderRepository.findAll(filters)
  },

  async getById(id: string): Promise<OrderWithItems> {
    return OrderRepository.findById(id)
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return OrderRepository.updateStatus(orderId, status)
  },

  async updateTracking(orderId: string, tracking_number: string | null, tracking_url: string | null): Promise<Order> {
    return OrderRepository.updateTracking(orderId, tracking_number, tracking_url)
  },

  async getByIdForUser(orderId: string, userId: string): Promise<OrderWithItems> {
    // RLS (auth.uid() = user_id) already scopes this to the caller's own orders — the
    // manual check below is a second, independent layer, not the only thing enforcing it.
    const order = await OrderRepository.findByIdForUser(orderId, userId)
    if ((order as any).user_id !== userId) throw new AppError('Order not found', 404)
    return order
  },
}
