'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IndianRupee, ShoppingBag, Users, Package, AlertTriangle, TrendingUp } from 'lucide-react'
import { StatsCard } from '@/components/admin/StatsCard'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { getDashboardStats } from '@/lib/api/admin/stats'
import { adminGetOrders } from '@/lib/api/admin/orders'
import type { DashboardStats } from '@/lib/services/adminStatsService'
import type { AdminOrderRow } from '@/lib/repositories/orderRepository'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<AdminOrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), adminGetOrders({ limit: 10 })])
      .then(([s, { orders }]) => {
        setStats(s)
        setRecentOrders(orders)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-body text-[1.5rem] font-bold text-[#1C1917] tracking-tight">Dashboard</h1>
        <p className="text-[0.85rem] text-[#78716C] mt-0.5">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Total Revenue" value={stats ? fmt(stats.revenue_total) : '—'} sub={`${fmt(stats?.revenue_today ?? 0)} today`} icon={IndianRupee} color="clay" loading={loading} />
        <StatsCard title="Orders" value={stats?.orders_total ?? '—'} sub={`${stats?.orders_today ?? 0} today`} icon={ShoppingBag} color="blue" loading={loading} />
        <StatsCard title="Customers" value={stats?.customers_total ?? '—'} sub="Registered users" icon={Users} color="sage" loading={loading} />
        <StatsCard title="Products" value={stats?.products_total ?? '—'} sub="Active listings" icon={Package} color="amber" loading={loading} />
        <StatsCard title="Low Stock" value={stats?.low_stock_count ?? '—'} sub="Items need restock" icon={AlertTriangle} color="red" loading={loading} />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#C4654A]" />
            <h2 className="font-semibold text-[#1C1917]">Recent Orders</h2>
          </div>
          <Link href="/admin/orders" className="text-[0.8rem] font-bold text-[#C4654A] hover:text-[#A0523A] transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[#F5F5F4] rounded-xl animate-pulse" />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag size={32} className="mx-auto text-[#D6D3D1] mb-3" />
            <p className="text-[0.9rem] font-semibold text-[#78716C]">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[#F5F5F4]">
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-[0.72rem] font-bold text-[#A8A29E] uppercase tracking-[0.06em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${order.id}`} className="font-bold text-[0.85rem] text-[#1C1917] hover:text-[#C4654A] transition-colors font-mono">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] text-[#44403C]">
                      {order.customer_phone ? `+91 ${order.customer_phone}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] text-[#78716C]">{order.item_count} item{order.item_count !== 1 ? 's' : ''}</td>
                    <td className="px-5 py-3.5 text-[0.85rem] font-bold text-[#1C1917]">
                      ₹{order.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3.5 text-[0.82rem] text-[#A8A29E] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
