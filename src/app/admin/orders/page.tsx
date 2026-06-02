'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { adminGetOrders } from '@/lib/api/admin/orders'
import type { AdminOrderRow } from '@/lib/repositories/orderRepository'
import { toast } from 'sonner'

const STATUS_FILTERS = ['', 'pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminGetOrders({ status: statusFilter || undefined, limit: 50 })
      setOrders(result.orders)
      setCount(result.count)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-[1.6rem] font-bold text-[#1C1917]">Orders</h1>
          <p className="text-[0.85rem] text-[#78716C] mt-0.5">{count} order{count !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-[0.875rem] font-semibold text-[#44403C] hover:bg-[#F5F5F4] shadow-sm transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_FILTERS.map(s => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-[0.8rem] font-semibold transition-all border ${statusFilter === s ? 'bg-[#1C1917] text-white border-[#1C1917]' : 'bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#1C1917] hover:text-[#1C1917]'}`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-[#F5F5F4] rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-[3rem] mb-3">🛍️</div>
            <p className="font-semibold text-[#44403C]">No orders {statusFilter ? `with status "${statusFilter}"` : 'yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F4]">
                  {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[0.72rem] font-bold text-[#A8A29E] uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-[0.85rem] text-[#1C1917]">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] text-[#44403C]">
                      {order.customer_phone ? `+91 ${order.customer_phone}` : '—'}
                      {order.customer_name && <div className="text-[0.75rem] text-[#A8A29E]">{order.customer_name}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] text-[#78716C]">{order.item_count}</td>
                    <td className="px-5 py-3.5 font-bold text-[0.9rem] text-[#1C1917]">₹{order.total.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3.5 text-[0.82rem] text-[#A8A29E] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${order.id}`} className="text-[0.82rem] font-bold text-[#C4654A] hover:text-[#A0523A] transition-colors whitespace-nowrap">
                        View →
                      </Link>
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
