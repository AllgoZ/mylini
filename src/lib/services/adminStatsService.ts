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

    // Use DB-level aggregates (PostgREST v12 aggregate syntax) — no full-table scan
    const [revTotal, revToday, ordTotal, ordToday, customers, products, lowStock] = await Promise.all([
      supabase.from('orders').select('total.sum()').not('status', 'in', '(cancelled,refunded)'),
      supabase.from('orders').select('total.sum()').gte('created_at', todayStart.toISOString()).not('status', 'in', '(cancelled,refunded)'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).not('status', 'in', '(cancelled,refunded)'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).not('status', 'in', '(cancelled,refunded)'),
      supabase.from('users').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
      supabase.from('inventory').select('*', { count: 'exact', head: true }).filter('stock_available', 'lte', 'low_stock_threshold'),
    ])

    return {
      revenue_total: Number((revTotal.data as any)?.[0]?.sum ?? 0),
      revenue_today: Number((revToday.data as any)?.[0]?.sum ?? 0),
      orders_total: ordTotal.count ?? 0,
      orders_today: ordToday.count ?? 0,
      customers_total: customers.count ?? 0,
      products_total: products.count ?? 0,
      low_stock_count: lowStock.count ?? 0,
    }
  },
}
