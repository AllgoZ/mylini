import { createClient } from '@/lib/db/server'

export type DashboardStats = {
  revenue_total: number
  revenue_today: number
  orders_total: number
  orders_today: number
  customers_total: number
  products_total: number
  low_stock_count: number
}

export const AdminStatsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [ordersRes, ordersToday, customers, products, lowStock] = await Promise.all([
      supabase
        .from('orders')
        .select('total, status, created_at')
        .not('status', 'in', '(cancelled,refunded)'),

      supabase
        .from('orders')
        .select('total', { count: 'exact' })
        .gte('created_at', todayStart.toISOString())
        .not('status', 'in', '(cancelled,refunded)'),

      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .is('deleted_at', null),

      supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('status', 'active')
        .is('deleted_at', null),

      supabase
        .from('inventory')
        .select('variant_id')
        .filter('stock_available', 'lte', 'low_stock_threshold'),
    ])

    const allOrders = ordersRes.data ?? []
    const revenue_total = allOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
    const revenue_today = (ordersToday.data ?? []).reduce((sum: number, o: any) => sum + (o.total ?? 0), 0)

    return {
      revenue_total,
      revenue_today,
      orders_total: allOrders.length,
      orders_today: ordersToday.count ?? 0,
      customers_total: customers.count ?? 0,
      products_total: products.count ?? 0,
      low_stock_count: lowStock.data?.length ?? 0,
    }
  },
}
