'use client'

import { useState, useEffect } from 'react'
import { AdminDrawer } from './AdminDrawer'
import { adminCreateProduct, adminUpdateProduct, adminGetProduct, adminAddVariant, adminUpdateVariant, adminDeleteVariant, adminAddImage, adminDeleteImage, adminUpdateImage } from '@/lib/api/admin/products'
import { getCategories } from '@/lib/api/categories'
import type { ProductWithVariants } from '@/types/product'
import type { CategoryTree } from '@/lib/api/categories'
import { toast } from 'sonner'
import { Plus, Trash2, Star } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  productId: string | null
  onSaved: () => void
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.8rem] font-bold text-[#44403C]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

const INPUT = "w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] focus:ring-2 focus:ring-[#C4654A]/10 transition-all"

export function ProductDrawer({ open, onClose, productId, onSaved }: Props) {
  const [product, setProduct] = useState<ProductWithVariants | null>(null)
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'details' | 'variants' | 'images'>('details')

  // Form state
  const [form, setForm] = useState({
    name: '', slug: '', description: '', category_id: '',
    base_price: '', sale_price: '',
    is_featured: false, is_best_seller: false, is_new_arrival: false,
    status: 'draft' as 'draft' | 'active' | 'archived',
  })
  const [imageUrl, setImageUrl] = useState('')
  const [newVariant, setNewVariant] = useState({ sku: '', size: '', color: '', price_override: '' })

  useEffect(() => {
    if (!open) return
    setTab('details')
    getCategories().then(cats => setCategories(cats.flatMap(c => c.children?.length ? c.children : [c])))
    if (productId) {
      setLoading(true)
      adminGetProduct(productId)
        .then(p => {
          setProduct(p)
          setForm({
            name: p.name, slug: p.slug, description: p.description ?? '',
            category_id: p.category?.id ?? '',
            base_price: String(p.base_price), sale_price: String(p.sale_price ?? ''),
            is_featured: p.is_featured, is_best_seller: p.is_best_seller,
            is_new_arrival: p.is_new_arrival, status: p.status,
          })
        })
        .catch(e => toast.error(e.message))
        .finally(() => setLoading(false))
    } else {
      setProduct(null)
      setForm({ name: '', slug: '', description: '', category_id: '', base_price: '', sale_price: '', is_featured: false, is_best_seller: false, is_new_arrival: false, status: 'draft' })
    }
  }, [open, productId])

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.category_id || !form.base_price) {
      toast.error('Fill in all required fields')
      return
    }
    setSaving(true)
    try {
      const data = {
        name: form.name, slug: form.slug, description: form.description || undefined,
        category_id: form.category_id, base_price: Number(form.base_price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        is_featured: form.is_featured, is_best_seller: form.is_best_seller,
        is_new_arrival: form.is_new_arrival, status: form.status,
      }
      if (productId) {
        await adminUpdateProduct(productId, data)
        toast.success('Product updated')
      } else {
        await adminCreateProduct(data)
        toast.success('Product created')
      }
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddVariant = async () => {
    if (!productId || !newVariant.sku) return
    try {
      await adminAddVariant(productId, {
        sku: newVariant.sku,
        size: newVariant.size || undefined,
        color: newVariant.color || undefined,
        price_override: newVariant.price_override ? Number(newVariant.price_override) : undefined,
        is_active: true,
      })
      toast.success('Variant added')
      setNewVariant({ sku: '', size: '', color: '', price_override: '' })
      const p = await adminGetProduct(productId)
      setProduct(p)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!productId || !confirm('Delete this variant?')) return
    try {
      await adminDeleteVariant(productId, variantId)
      toast.success('Variant deleted')
      const p = await adminGetProduct(productId)
      setProduct(p)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleAddImage = async () => {
    if (!productId || !imageUrl) return
    try {
      await adminAddImage(productId, { public_url: imageUrl, is_primary: product?.images?.length === 0, sort_order: product?.images?.length ?? 0 })
      toast.success('Image added')
      setImageUrl('')
      const p = await adminGetProduct(productId)
      setProduct(p)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const TABS = [
    { key: 'details', label: 'Details' },
    { key: 'variants', label: `Variants${product?.variants?.length ? ` (${product.variants.length})` : ''}` },
    { key: 'images', label: `Images${product?.images?.length ? ` (${product.images.length})` : ''}` },
  ]

  const footer = (
    <div className="flex items-center justify-between">
      <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#E7E5E4] text-[0.875rem] font-semibold text-[#44403C] hover:bg-[#F5F5F4] transition-colors">Cancel</button>
      {tab === 'details' && (
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : productId ? 'Save Changes' : 'Create Product'}
        </button>
      )}
    </div>
  )

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={productId ? 'Edit Product' : 'New Product'}
      subtitle={productId ? form.name : 'Add a new product to your store'}
      footer={footer}
    >
      {/* Tabs */}
      <div className="flex gap-1 bg-[#F5F5F4] p-1 rounded-xl mb-5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            disabled={t.key !== 'details' && !productId}
            className={`flex-1 py-2 rounded-lg text-[0.82rem] font-semibold transition-all ${tab === t.key ? 'bg-white text-[#1C1917] shadow-sm' : 'text-[#78716C] hover:text-[#44403C] disabled:opacity-40'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-[#F5F5F4] rounded-xl animate-pulse" />)}</div>
      ) : tab === 'details' ? (
        <div className="space-y-4">
          <Field label="Product Name" required>
            <input className={INPUT} value={form.name} onChange={e => {
              const name = e.target.value
              setForm(f => ({ ...f, name, slug: f.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))
            }} placeholder="e.g. Silk Pattupavadai Set" />
          </Field>

          <Field label="URL Slug" required>
            <input className={INPUT} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="silk-pattupavadai-set" />
          </Field>

          <Field label="Description">
            <textarea className={`${INPUT} min-h-[80px] resize-none`} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description for SEO and product page..." />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <select className={INPUT} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={INPUT} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Base Price (₹)" required>
              <input type="number" className={INPUT} value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} placeholder="2499" />
            </Field>
            <Field label="Sale Price (₹)">
              <input type="number" className={INPUT} value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} placeholder="Optional" />
            </Field>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {(['is_featured', 'is_best_seller', 'is_new_arrival'] as const).map(key => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                  className={`w-10 h-5.5 rounded-full transition-colors relative ${form[key] ? 'bg-[#C4654A]' : 'bg-[#D6D3D1]'}`}>
                  <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-[0.875rem] font-medium text-[#44403C] capitalize">{key.replace('is_', '').replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      ) : tab === 'variants' ? (
        <div className="space-y-4">
          {/* Existing variants */}
          {product?.variants?.filter(v => !v.deleted_at).map(v => (
            <div key={v.id} className="flex items-center gap-3 p-3.5 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[0.8rem] font-bold text-[#1C1917] bg-[#F5F5F4] px-2 py-0.5 rounded">{v.sku}</span>
                  {v.size && <span className="text-[0.8rem] text-[#44403C] bg-[#EFF6FF] px-2 py-0.5 rounded font-medium">{v.size}</span>}
                  {v.color && <span className="text-[0.8rem] text-[#44403C]">{v.color}</span>}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  {v.price_override && <span className="text-[0.78rem] font-bold text-[#C4654A]">₹{v.price_override.toLocaleString('en-IN')}</span>}
                  <span className={`text-[0.72rem] font-bold px-2 py-0.5 rounded-full ${v.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {v.inventory && (
                    <span className={`text-[0.72rem] font-medium ${v.inventory.stock_available <= v.inventory.low_stock_threshold ? 'text-red-500' : 'text-[#78716C]'}`}>
                      {v.inventory.stock_available} in stock
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDeleteVariant(v.id)} className="p-1.5 text-[#A8A29E] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          {/* Add new variant */}
          <div className="p-4 bg-[#F5F5F4] rounded-xl border border-dashed border-[#D6D3D1]">
            <p className="text-[0.8rem] font-bold text-[#44403C] mb-3">Add Variant</p>
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <input className={`${INPUT} text-sm`} placeholder="SKU *" value={newVariant.sku} onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))} />
              <input className={`${INPUT} text-sm`} placeholder="Size (e.g. 2-3 Yrs)" value={newVariant.size} onChange={e => setNewVariant(v => ({ ...v, size: e.target.value }))} />
              <input className={`${INPUT} text-sm`} placeholder="Color" value={newVariant.color} onChange={e => setNewVariant(v => ({ ...v, color: e.target.value }))} />
              <input type="number" className={`${INPUT} text-sm`} placeholder="Price override (₹)" value={newVariant.price_override} onChange={e => setNewVariant(v => ({ ...v, price_override: e.target.value }))} />
            </div>
            <button onClick={handleAddVariant} disabled={!newVariant.sku} className="flex items-center gap-1.5 text-[0.82rem] font-bold text-[#C4654A] hover:text-[#A0523A] disabled:opacity-40 transition-colors">
              <Plus size={14} /> Add Variant
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {product?.images?.map(img => (
            <div key={img.id} className="flex items-center gap-3 p-3 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4]">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E7E5E4] shrink-0">
                <img src={img.public_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.78rem] text-[#78716C] truncate">{img.public_url}</p>
                {img.is_primary && <span className="text-[0.7rem] font-bold text-amber-600 flex items-center gap-1"><Star size={11} /> Primary</span>}
              </div>
              <div className="flex gap-1 shrink-0">
                {!img.is_primary && (
                  <button onClick={() => adminUpdateImage(productId!, img.id, { is_primary: true }).then(() => adminGetProduct(productId!).then(setProduct))}
                    className="p-1.5 text-[#A8A29E] hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Set as primary">
                    <Star size={14} />
                  </button>
                )}
                <button onClick={() => adminDeleteImage(productId!, img.id).then(() => adminGetProduct(productId!).then(setProduct))}
                  className="p-1.5 text-[#A8A29E] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <input className={`${INPUT} flex-1 text-sm`} placeholder="Paste image URL..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
            <button onClick={handleAddImage} disabled={!imageUrl} className="px-3.5 py-2.5 bg-[#C4654A] text-white rounded-xl text-sm font-bold hover:bg-[#A0523A] disabled:opacity-50 transition-colors whitespace-nowrap">
              Add Image
            </button>
          </div>
          <p className="text-[0.75rem] text-[#A8A29E]">Enter a public URL (Unsplash, CDN, etc). R2 upload coming in Phase 5.</p>
        </div>
      )}
    </AdminDrawer>
  )
}
