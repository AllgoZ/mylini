import { createClient } from '@/lib/db/server'
import { NotFoundError } from '@/lib/utils/errors'
import type { Order, OrderWithItems, OrderStatus, OrderSummary } from '@/types/order'
import type { Database } from '@/lib/db/generated/database.types'

export type AdminOrderRow = OrderSummary & {
  user_id: string
  customer_phone: string | null
  customer_name: string | null
}

type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

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

  async findById(id: string): Promise<OrderWithItems> {
    const supabase = await createClient()
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
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, subtotal, discount, total, created_at, items:order_items(quantity)')
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
    }))
  },

  async findAll(filters: {
    status?: string
    page?: number
    limit?: number
    search?: string
  }): Promise<{ orders: AdminOrderRow[]; count: number }> {
    const supabase = await createClient()
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
    const supabase = await createClient()
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
}
