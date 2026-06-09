'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { adminGetCoupons, adminDisableCoupon, adminUpdateCoupon } from '@/lib/api/admin/coupons'
import { CouponDrawer } from '@/components/admin/CouponDrawer'
import type { Coupon } from '@/types/coupon'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminGetCoupons({ limit: 50 })
      setCoupons(result.coupons)
      setCount(result.count)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (coupon: Coupon) => {
    try {
      if (coupon.is_active) {
        await adminDisableCoupon(coupon.id)
        toast.success('Coupon disabled')
      } else {
        await adminUpdateCoupon(coupon.id, { is_active: true })
        toast.success('Coupon enabled')
      }
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-body text-[1.5rem] font-bold text-[#1C1917] tracking-tight">Coupons</h1>
          <p className="text-[0.85rem] text-[#78716C] mt-0.5">{count} coupon{count !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#F5F5F4] shadow-sm transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setEditingCoupon(null); setDrawerOpen(true) }}
            className="flex items-center gap-2 bg-[#C4654A] text-white px-4 py-2.5 rounded-xl text-[0.875rem] font-bold shadow-sm hover:bg-[#A0523A] transition-colors"
          >
            <Plus size={16} /> New Coupon
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#F5F5F4] rounded-xl animate-pulse" />)}</div>
        ) : coupons.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-[3rem] mb-3">🏷️</div>
            <p className="font-semibold text-[#44403C] mb-1">No coupons yet</p>
            <p className="text-[0.85rem] text-[#78716C]">Create your first coupon to offer discounts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F4]">
                  {['Code', 'Type', 'Value', 'Min. Order', 'Usage', 'Expires', 'Active', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[0.72rem] font-bold text-[#A8A29E] uppercase tracking-[0.06em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {coupons.map(c => (
                  <tr key={c.id} className={cn('transition-colors', c.is_active ? 'hover:bg-[#FAFAF9]' : 'bg-[#F5F5F4]/50 opacity-60')}>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-[0.875rem] text-[#1C1917] bg-[#F5F5F4] px-2.5 py-1 rounded-lg tracking-[0.04em]">{c.code}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] text-[#78716C] capitalize">{c.type}</td>
                    <td className="px-5 py-3.5 font-bold text-[0.9rem] text-[#1C1917]">
                      {c.type === 'percentage' ? `${c.value}%` : `₹${c.value.toLocaleString('en-IN')}`}
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] text-[#78716C]">₹{c.minimum_order.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 text-[0.85rem] text-[#78716C]">
                      {c.usage_count}{c.usage_limit ? `/${c.usage_limit}` : ' used'}
                    </td>
                    <td className="px-5 py-3.5 text-[0.82rem] text-[#A8A29E] whitespace-nowrap">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleToggle(c)} className={cn('transition-colors', c.is_active ? 'text-green-600 hover:text-green-700' : 'text-[#A8A29E] hover:text-[#78716C]')}>
                        {c.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => { setEditingCoupon(c); setDrawerOpen(true) }} className="p-1.5 rounded-lg text-[#A8A29E] hover:text-blue-600 hover:bg-[#EFF6FF] transition-colors">
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CouponDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} coupon={editingCoupon} onSaved={() => { setDrawerOpen(false); load() }} />
    </div>
  )
}
