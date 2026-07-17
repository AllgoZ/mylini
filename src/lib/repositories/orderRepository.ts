import { createClient } from '@/lib/db/server'
import { createAdminClient } from '@/lib/db/admin'
import { createAuthenticatedClient } from '@/lib/db/authenticatedClient'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { Order, OrderWithItems, OrderStatus, OrderSummary, AdminOrderSummary } from '@/types/order'
import type { Database } from '@/lib/db/generated/database.types'

export type AdminOrderRow = AdminOrderSummary & {
  user_id: string
  customer_phone: string | null
  customer_name: string | null
}

type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

export type CreateOrderTransactionalInput = {
  user_id: string
  address_id: string
  coupon_id: string | null
  subtotal: number
  discount: number
  total: number
  notes: string | null
  items: {
    variant_id: string
    quantity: number
    unit_price: number
    total_price: number
    product_name_snapshot: string
    sku_snapshot: string
    variant_snapshot: string
    image_snapshot: string | null
  }[]
}

export const OrderRepository = {
  async create(data: Database['public']['Tables']['orders']['Insert']): Promise<Order> {
    const supabase = await createClient()
    const { data: order, error } = await supabase
      .from('orders')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(data as any)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return order
  },

  async addItems(items: OrderItemInsert[]): Promise<void> {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('order_items').insert(items as any)
    if (error) throw new Error(error.message)
  },

  // Atomic replacement for create() + addItems() + per-item stock decrement + coupon usage —
  // see migration 030. All of it runs inside a single Postgres function call, so it's either
  // fully committed or fully rolled back, and it's one round trip instead of 4N+2.
  async createTransactional(input: CreateOrderTransactionalInput): Promise<Order> {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('create_order_transactional', {
      p_user_id: input.user_id,
      p_address_id: input.address_id,
      p_coupon_id: input.coupon_id,
      p_subtotal: input.subtotal,
      p_discount: input.discount,
      p_total: input.total,
      p_notes: input.notes,
      p_items: input.items,
    })

    if (error) {
      const message = error.message ?? ''
      const stockMatch = message.match(/INSUFFICIENT_STOCK:([0-9a-f-]+)/i)
      if (stockMatch) {
        // Same error type/message OrderService threw before the atomic refactor
        throw new ValidationError(`Insufficient stock for variant ${stockMatch[1]}`)
      }
      if (message.includes('COUPON_INVALID')) {
        // Matches prior behavior: a coupon-usage race here previously surfaced as a
        // generic Error too (via CouponRepository.incrementUsage's RPC), i.e. a 500
        // with no message leaked to the client — same outcome here.
        throw new Error('Coupon is no longer valid')
      }
      throw new Error(message)
    }

    return data as Order
  },

  // Admin-only read (no ownership scoping) — uses the service-role client.
  async findById(id: string): Promise<OrderWithItems> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        address:addresses!inner(*),
        coupon:coupons(id, code, type, value)
      `)
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundError(`Order '${id}'`)
    return data as unknown as OrderWithItems
  },

  // Customer read, scoped to the caller — uses the authenticated (JWT) client, so RLS
  // (auth.uid() = user_id) makes another user's order invisible even before the
  // app-layer ownership check in OrderService.getByIdForUser runs.
  async findByIdForUser(id: string, userId: string): Promise<OrderWithItems> {
    const supabase = await createAuthenticatedClient(userId)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        address:addresses!inner(*),
        coupon:coupons(id, code, type, value)
      `)
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundError(`Order '${id}'`)
    return data as unknown as OrderWithItems
  },

  async findByUserId(userId: string): Promise<OrderSummary[]> {
    const supabase = await createAuthenticatedClient(userId)
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, subtotal, discount, total, created_at, tracking_number, tracking_url, items:order_items(quantity, product_name_snapshot, image_snapshot)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []).map((o: any) => ({
      id: o.id,
      status: o.status,
      subtotal: o.subtotal,
      discount: o.discount,
      total: o.total,
      created_at: o.created_at,
      item_count: (o.items ?? []).reduce((n: number, i: any) => n + i.quantity, 0),
      items_preview: (o.items ?? []).slice(0, 3).map((i: any) => ({
        product_name_snapshot: i.product_name_snapshot ?? '',
        image_snapshot: i.image_snapshot ?? null,
      })),
    }))
  },

  async findAll(filters: {
    status?: string
    page?: number
    limit?: number
    search?: string
  }): Promise<{ orders: AdminOrderRow[]; count: number }> {
    const supabase = createAdminClient()
    const page = filters.page ?? 1
    const limit = filters.limit ?? 30
    const from = (page - 1) * limit

    let query = supabase
      .from('orders')
      .select(`
        id, status, subtotal, discount, total, created_at, user_id,
        user:users(phone, name),
        items:order_items(quantity)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (filters.status) query = query.eq('status', filters.status as any)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return {
      orders: (data ?? []).map((o: any) => ({
        id: o.id,
        status: o.status,
        subtotal: o.subtotal,
        discount: o.discount,
        total: o.total,
        created_at: o.created_at,
        user_id: o.user_id,
        customer_phone: o.user?.phone ?? null,
        customer_name: o.user?.name ?? null,
        item_count: (o.items ?? []).reduce((n: number, i: any) => n + i.quantity, 0),
      })),
      count: count ?? 0,
    }
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new NotFoundError(`Order '${id}'`)
    return data
  },

  async updateTracking(id: string, tracking_number: string | null, tracking_url: string | null): Promise<Order> {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('orders')
      .update({ tracking_number, tracking_url })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new NotFoundError(`Order '${id}'`)
    return data
  },
}
