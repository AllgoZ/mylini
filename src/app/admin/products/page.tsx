'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, RefreshCw, Pencil, Trash2, ChevronDown, Star, Sparkles, Tag } from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { adminListProducts, adminDeleteProduct, adminUpdateProduct } from '@/lib/api/admin/products'
import { getCategories } from '@/lib/api/categories'
import type { ProductListItem } from '@/types/product'
import type { CategoryTree } from '@/lib/api/categories'
import { toast } from 'sonner'

type SortKey = 'newest' | 'oldest' | 'name_asc' | 'price_asc' | 'price_desc'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const result = await adminListProducts({ search: search || undefined, status: statusFilter || undefined, category: categoryFilter || undefined, limit: 30 })
      let items = result.items

      // Client-side sort
      if (sortKey === 'oldest') items = [...items].reverse()
      else if (sortKey === 'name_asc') items = [...items].sort((a, b) => a.name.localeCompare(b.name))
      else if (sortKey === 'price_asc') items = [...items].sort((a, b) => (a.sale_price ?? a.base_price) - (b.sale_price ?? b.base_price))
      else if (sortKey === 'price_desc') items = [...items].sort((a, b) => (b.sale_price ?? b.base_price) - (a.sale_price ?? a.base_price))

      setProducts(items)
      setCount(result.count)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter, sortKey])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    getCategories().then(cats => setCategories(cats.flatMap(c => c.children?.length ? c.children : [c])))
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"? It will no longer appear in the store.`)) return
    try {
      await adminDeleteProduct(id)
      toast.success('Product archived')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === products.length) setSelected(new Set())
    else setSelected(new Set(products.map(p => p.id)))
  }

  const bulkAction = async (action: 'publish' | 'archive' | 'delete' | 'feature') => {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    setBulkLoading(true)
    try {
      await Promise.all(ids.map(id => {
        if (action === 'publish') return adminUpdateProduct(id, { status: 'active' } as any)
        if (action === 'archive') return adminUpdateProduct(id, { status: 'archived' } as any)
        if (action === 'delete') return adminDeleteProduct(id)
        if (action === 'feature') return adminUpdateProduct(id, { is_featured: true } as any)
        return Promise.resolve()
      }))
      toast.success(`${ids.length} product${ids.length > 1 ? 's' : ''} updated`)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const hasFilters = search || statusFilter || categoryFilter

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-body text-[1.5rem] font-bold text-[#1C1917] tracking-tight">Products</h1>
          <p className="text-[0.85rem] text-[#78716C] mt-0.5">{count} product{count !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 bg-[#C4654A] text-white px-4 py-2.5 rounded-xl text-[0.875rem] font-bold shadow-sm hover:bg-[#A0523A] transition-all hover:-translate-y-0.5">
          <Plus size={16} /> New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-white border border-[#E7E5E4] rounded-xl px-3.5 h-10 flex-1 min-w-[180px] max-w-sm focus-within:border-[#C4654A] transition-colors shadow-sm">
          <Search size={15} className="text-[#A8A29E] shrink-0" />
          <input type="text" placeholder="Search products…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[0.875rem] text-[#1C1917] placeholder:text-[#A8A29E]" />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-[#E7E5E4] rounded-xl px-3.5 h-10 text-[0.875rem] text-[#44403C] outline-none shadow-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="hidden">Hidden</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="bg-white border border-[#E7E5E4] rounded-xl px-3.5 h-10 text-[0.875rem] text-[#44403C] outline-none shadow-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>

        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
          className="bg-white border border-[#E7E5E4] rounded-xl px-3.5 h-10 text-[0.875rem] text-[#44403C] outline-none shadow-sm">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_asc">Name A–Z</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        <button onClick={load} className="p-2.5 rounded-xl border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#F5F5F4] shadow-sm transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setSortKey('newest') }}
            className="text-[0.82rem] font-semibold text-[#C4654A] hover:text-[#A0523A] transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#1C1917] text-white px-5 py-3 rounded-xl mb-4 shadow-lg">
          <p className="text-[0.85rem] font-semibold flex-1">{selected.size} selected</p>
          <button onClick={() => bulkAction('publish')} disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 text-white text-[0.82rem] font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
            Publish
          </button>
          <button onClick={() => bulkAction('feature')} disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 text-white text-[0.82rem] font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors">
            <Star size={13} /> Feature
          </button>
          <button onClick={() => bulkAction('archive')} disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#374151] text-white text-[0.82rem] font-bold rounded-xl hover:bg-[#4B5563] disabled:opacity-50 transition-colors">
            Archive
          </button>
          <button onClick={() => { if (confirm(`Delete ${selected.size} products? This cannot be undone.`)) bulkAction('delete') }} disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 text-white text-[0.82rem] font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="text-white/60 hover:text-white text-[0.82rem] ml-1">
            Cancel
          </button>
        </div>
      )}

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
              {hasFilters ? 'Try adjusting your filters.' : 'Create your first product to get started.'}
            </p>
            {!hasFilters && (
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
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.size === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[#D1D5DB] text-[#C4654A] accent-[#C4654A] cursor-pointer" />
                  </th>
                  {['Product', 'Category', 'Price', 'Labels', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[0.72rem] font-bold text-[#A8A29E] uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {products.map(p => (
                  <tr key={p.id} className={`transition-colors group ${selected.has(p.id) ? 'bg-[#FFF7F5]' : 'hover:bg-[#FAFAF9]'}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 rounded border-[#D1D5DB] accent-[#C4654A] cursor-pointer" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] overflow-hidden shrink-0 border border-[#E7E5E4]">
                          {p.primary_image ? (
                            <Image src={p.primary_image} alt={p.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
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
                    <td className="px-4 py-3.5 text-[0.85rem] text-[#44403C]">{(p as any).category?.name ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[0.875rem] text-[#1C1917]">₹{(p.sale_price ?? p.base_price).toLocaleString('en-IN')}</div>
                      {p.sale_price && <div className="text-[0.75rem] text-[#A8A29E] line-through">₹{p.base_price.toLocaleString('en-IN')}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {p.is_featured && <span title="Featured"><Star size={13} className="text-amber-400 fill-amber-400" /></span>}
                        {p.is_best_seller && <span title="Best Seller" className="text-[0.65rem] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">HOT</span>}
                        {p.is_new_arrival && <span title="New Arrival" className="text-[0.65rem] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">NEW</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.status} type="product" /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/products/${p.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#78716C] hover:text-blue-600 transition-colors" title="Edit">
                          <Pencil size={15} />
                        </Link>
                        <button onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#78716C] hover:text-red-600 transition-colors" title="Archive">
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
