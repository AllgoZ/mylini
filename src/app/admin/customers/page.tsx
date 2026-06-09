'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { adminGetCustomers } from '@/lib/api/admin/customers'
import type { CustomerWithStats } from '@/lib/repositories/userRepository'
import { toast } from 'sonner'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminGetCustomers({ search: search || undefined, limit: 100 })
      setCustomers(result.users)
      setCount(result.count)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-body text-[1.5rem] font-bold text-[#1C1917] tracking-tight">Customers</h1>
          <p className="text-[0.85rem] text-[#78716C] mt-0.5">{count} registered customer{count !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#F5F5F4] shadow-sm transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-[#E7E5E4] rounded-xl px-3.5 h-10 max-w-sm mb-5 focus-within:border-[#C4654A] transition-colors shadow-sm">
        <Search size={15} className="text-[#A8A29E] shrink-0" />
        <input
          type="text"
          placeholder="Search by phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-[0.875rem] text-[#1C1917] placeholder:text-[#A8A29E]"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-[#F5F5F4] rounded-xl animate-pulse" />)}</div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-[3rem] mb-3">👥</div>
            <p className="font-semibold text-[#44403C]">No customers yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F4]">
                  {['Phone', 'Name', 'Orders', 'Total Spent', 'Last Order', 'Joined'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[0.72rem] font-bold text-[#A8A29E] uppercase tracking-[0.06em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-[0.875rem] text-[#1C1917]">+91 {c.phone}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] text-[#44403C]">{c.name ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold text-[0.875rem] ${c.order_count > 0 ? 'text-[#1C1917]' : 'text-[#A8A29E]'}`}>
                        {c.order_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[0.9rem] text-[#1C1917]">
                      {c.total_spend > 0 ? `₹${c.total_spend.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[0.82rem] text-[#A8A29E] whitespace-nowrap">
                      {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[0.82rem] text-[#A8A29E] whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
