'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { adminListProducts, adminDeleteProduct } from '@/lib/api/admin/products'
import type { ProductListItem } from '@/types/product'
import { toast } from 'sonner'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminListProducts({ search: search || undefined, status: statusFilter || undefined, limit: 50 })
      setProducts(result.items)
      setCount(result.count)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"? It will no longer appear in the store.`)) return
    try {
      await adminDeleteProduct(id)
      toast.success('Product archived')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-[1.6rem] font-bold text-[#1C1917]">Products</h1>
          <p className="text-[0.85rem] text-[#78716C] mt-0.5">{count} product{count !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-[#C4654A] text-white px-4 py-2.5 rounded-xl text-[0.875rem] font-bold shadow-sm hover:bg-[#A0523A] transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} /> New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-[#E7E5E4] rounded-xl px-3.5 h-10 flex-1 min-w-[200px] max-w-sm focus-within:border-[#C4654A] transition-colors shadow-sm">
          <Search size={15} className="text-[#A8A29E] shrink-0" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[0.875rem] text-[#1C1917] placeholder:text-[#A8A29E]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-[#E7E5E4] rounded-xl px-3.5 h-10 text-[0.875rem] text-[#44403C] outline-none shadow-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={load} className="p-2.5 rounded-xl border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#F5F5F4] shadow-sm transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#F5F5F4] rounded-xl animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-[3rem] mb-3">📦</div>
            <p className="font-semibold text-[#44403C] mb-1">No products found</p>
            <p className="text-[0.85rem] text-[#78716C] mb-5">
              {search || statusFilter ? 'Try adjusting your filters.' : 'Create your first product to get started.'}
            </p>
            {!search && !statusFilter && (
              <Link href="/admin/products/new" className="inline-flex items-center gap-2 bg-[#C4654A] text-white px-5 py-2.5 rounded-xl text-[0.875rem] font-bold hover:bg-[#A0523A] transition-colors">
                <Plus size={15} /> Create Product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F5F4]">
                  {['Product', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[0.72rem] font-bold text-[#A8A29E] uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAF9] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] overflow-hidden shrink-0 border border-[#E7E5E4]">
                          {p.primary_image ? (
                            <Image src={p.primary_image} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[1.2rem]">👗</div>
                          )}
                        </div>
                        <div>
                          <Link href={`/admin/products/${p.id}/edit`} className="font-semibold text-[0.875rem] text-[#1C1917] hover:text-[#C4654A] transition-colors line-clamp-1">
                            {p.name}
                          </Link>
                          <p className="text-[0.75rem] text-[#A8A29E]">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[0.85rem] text-[#44403C]">{p.category?.name ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[0.875rem] text-[#1C1917]">₹{(p.sale_price ?? p.base_price).toLocaleString('en-IN')}</div>
                      {p.sale_price && <div className="text-[0.75rem] text-[#A8A29E] line-through">₹{p.base_price.toLocaleString('en-IN')}</div>}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.status} type="product" /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/products/${p.id}/edit`} className="p-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#78716C] hover:text-blue-600 transition-colors" title="Edit product">
                          <Pencil size={15} />
                        </Link>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#78716C] hover:text-red-600 transition-colors" title="Archive product">
                          <Trash2 size={15} />
                        </button>
                      </div>
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
