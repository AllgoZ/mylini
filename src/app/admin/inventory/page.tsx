'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { RefreshCw, Check } from 'lucide-react'
import { adminGetInventory, adminAdjustStock } from '@/lib/api/admin/inventory'
import type { AdminInventoryRow } from '@/lib/repositories/inventoryRepository'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function StockIndicator({ available, threshold }: { available: number; threshold: number }) {
  if (available === 0) return <span className="flex items-center gap-1 text-[0.72rem] font-bold text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Out of Stock</span>
  if (available <= threshold) return <span className="flex items-center gap-1 text-[0.72rem] font-bold text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500" />Low Stock</span>
  return <span className="flex items-center gap-1 text-[0.72rem] font-bold text-green-700"><span className="w-2 h-2 rounded-full bg-green-500" />In Stock</span>
}

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<AdminInventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState<Record<string, { value: string; reason: 'restock' | 'adjustment' }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try { setRows(await adminGetInventory()) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdjust = async (variantId: string) => {
    const a = adjusting[variantId]
    if (!a || a.value === '') return
    setSaving(s => ({ ...s, [variantId]: true }))
    try {
      await adminAdjustStock(variantId, Number(a.value), a.reason)
      toast.success('Stock updated')
      setAdjusting(prev => { const n = { ...prev }; delete n[variantId]; return n })
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(s => ({ ...s, [variantId]: false }))
    }
  }

  const low = rows.filter(r => r.stock_available > 0 && r.stock_available <= r.low_stock_threshold).length
  const out = rows.filter(r => r.stock_available === 0).length

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-body text-[1.5rem] font-bold text-[#1C1917] tracking-tight">Inventory</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-[0.82rem] text-[#78716C]">{rows.length} variants</span>
            {low > 0 && <span className="text-[0.82rem] font-bold text-amber-600">🟡 {low} low stock</span>}
            {out > 0 && <span className="text-[0.82rem] font-bold text-red-600">🔴 {out} out of stock</span>}
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-[0.875rem] font-semibold text-[#44403C] hover:bg-[#F5F5F4] shadow-sm transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#F5F5F4] rounded-xl animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-[3rem] mb-3">📦</div>
            <p className="font-semibold text-[#44403C]">No inventory found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F4]">
                  {['Product', 'SKU', 'Variant', 'Available', 'Reserved', 'Status', 'Adjust'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[0.72rem] font-bold text-[#A8A29E] uppercase tracking-[0.06em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {rows.map(row => {
                  const isAdjusting = !!adjusting[row.variant_id]
                  return (
                    <tr key={row.variant_id} className={cn('transition-colors', row.stock_available === 0 ? 'bg-red-50/30' : row.stock_available <= row.low_stock_threshold ? 'bg-amber-50/30' : 'hover:bg-[#FAFAF9]')}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-[#F5F5F4] overflow-hidden shrink-0 border border-[#E7E5E4]">
                            {row.primary_image ? <Image src={row.primary_image} alt="" width={36} height={36} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-[1rem]">👗</div>}
                          </div>
                          <span className="font-semibold text-[0.85rem] text-[#1C1917] line-clamp-1 max-w-[140px]">{row.product_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><span className="font-mono text-[0.8rem] text-[#44403C] bg-[#F5F5F4] px-2 py-0.5 rounded">{row.sku}</span></td>
                      <td className="px-5 py-3.5 text-[0.85rem] text-[#78716C]">{[row.size, row.color].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="px-5 py-3.5 font-bold text-[0.95rem] text-[#1C1917]">{row.stock_available}</td>
                      <td className="px-5 py-3.5 text-[0.85rem] text-[#78716C]">{row.stock_reserved}</td>
                      <td className="px-5 py-3.5"><StockIndicator available={row.stock_available} threshold={row.low_stock_threshold} /></td>
                      <td className="px-5 py-3.5">
                        {isAdjusting ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={adjusting[row.variant_id]?.value ?? ''}
                              onChange={e => setAdjusting(a => ({ ...a, [row.variant_id]: { ...a[row.variant_id], value: e.target.value } }))}
                              className="w-16 border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-[0.82rem] text-[#1C1917] outline-none focus:border-[#C4654A]"
                              autoFocus
                            />
                            <select
                              value={adjusting[row.variant_id]?.reason ?? 'restock'}
                              onChange={e => setAdjusting(a => ({ ...a, [row.variant_id]: { ...a[row.variant_id], reason: e.target.value as any } }))}
                              className="border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-[0.78rem] text-[#44403C] outline-none"
                            >
                              <option value="restock">Restock</option>
                              <option value="adjustment">Adjustment</option>
                            </select>
                            <button onClick={() => handleAdjust(row.variant_id)} disabled={saving[row.variant_id]} className="p-1.5 rounded-lg bg-[#C4654A] text-white hover:bg-[#A0523A] transition-colors">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setAdjusting(a => { const n = { ...a }; delete n[row.variant_id]; return n })} className="p-1.5 rounded-lg border border-[#E7E5E4] text-[#78716C] hover:bg-[#F5F5F4] transition-colors text-[0.75rem]">✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAdjusting(a => ({ ...a, [row.variant_id]: { value: String(row.stock_available), reason: 'restock' } }))}
                            className="text-[0.8rem] font-semibold text-[#C4654A] hover:text-[#A0523A] transition-colors"
                          >
                            Adjust
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
