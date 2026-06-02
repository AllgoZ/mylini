'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Plus, Trash2, Star, Save, Check } from 'lucide-react'
import {
  adminCreateProduct, adminUpdateProduct, adminGetProduct,
  adminAddVariant, adminDeleteVariant,
  adminAddImage, adminDeleteImage, adminUpdateImage,
} from '@/lib/api/admin/products'
import { getCategories } from '@/lib/api/categories'
import type { ProductWithVariants } from '@/types/product'
import type { CategoryTree } from '@/lib/api/categories'
import { toast } from 'sonner'

const INPUT = "w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] focus:ring-2 focus:ring-[#C4654A]/10 transition-all"

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-0.5 h-5 bg-[#C4654A] rounded-full" />
      <h2 className="font-head text-[0.875rem] font-bold text-[#1C1917] uppercase tracking-[0.08em]">{children}</h2>
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.82rem] font-bold text-[#44403C]">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={onChange}
        className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-[#C4654A]' : 'bg-[#D6D3D1]'}`}
      >
        <span className={`absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-[0.875rem] font-medium text-[#44403C]">{label}</span>
    </label>
  )
}

interface Props {
  productId?: string
}

export function ProductForm({ productId }: Props) {
  const router = useRouter()
  const isEdit = !!productId

  const [product, setProduct] = useState<ProductWithVariants | null>(null)
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft')
  const [basePrice, setBasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [isNewArrival, setIsNewArrival] = useState(false)

  // Variant state
  const [newVariant, setNewVariant] = useState({ sku: '', size: '', color: '', price_override: '' })
  const [addingVariant, setAddingVariant] = useState(false)

  // Image state
  const [newImageUrl, setNewImageUrl] = useState('')
  const [addingImage, setAddingImage] = useState(false)

  useEffect(() => {
    getCategories().then(cats => setCategories(cats.flatMap(c => c.children?.length ? c.children : [c])))

    if (productId) {
      adminGetProduct(productId)
        .then(p => {
          setProduct(p)
          setName(p.name)
          setSlug(p.slug)
          setDescription(p.description ?? '')
          setCategoryId(p.category?.id ?? '')
          setStatus(p.status)
          setBasePrice(String(p.base_price))
          setSalePrice(String(p.sale_price ?? ''))
          setIsFeatured(p.is_featured)
          setIsBestSeller(p.is_best_seller)
          setIsNewArrival(p.is_new_arrival)
        })
        .catch(e => toast.error(e.message))
        .finally(() => setLoading(false))
    }
  }, [productId])

  const refreshProduct = async () => {
    if (!productId) return
    const p = await adminGetProduct(productId)
    setProduct(p)
  }

  const handleSave = async () => {
    if (!name || !slug || !categoryId || !basePrice) {
      toast.error('Fill in all required fields (Name, Slug, Category, Base Price)')
      return
    }
    setSaving(true)
    try {
      const data = {
        name, slug, description: description || undefined,
        category_id: categoryId,
        base_price: Number(basePrice),
        sale_price: salePrice ? Number(salePrice) : null,
        is_featured: isFeatured, is_best_seller: isBestSeller, is_new_arrival: isNewArrival,
        status,
      }

      if (isEdit && productId) {
        await adminUpdateProduct(productId, data)
        toast.success('Product saved')
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const created = await adminCreateProduct(data)
        toast.success('Product created')
        router.replace(`/admin/products/${created.id}/edit`)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddVariant = async () => {
    if (!productId || !newVariant.sku) return
    setAddingVariant(true)
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
      await refreshProduct()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAddingVariant(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!productId || !confirm('Delete this variant?')) return
    try {
      await adminDeleteVariant(productId, variantId)
      toast.success('Variant removed')
      await refreshProduct()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleAddImage = async () => {
    if (!productId || !newImageUrl) return
    setAddingImage(true)
    try {
      await adminAddImage(productId, {
        public_url: newImageUrl,
        sort_order: product?.images?.length ?? 0,
        is_primary: !product?.images?.length,
      })
      toast.success('Image added')
      setNewImageUrl('')
      await refreshProduct()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAddingImage(false)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!productId) return
    try {
      await adminUpdateImage(productId, imageId, { is_primary: true })
      await refreshProduct()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!productId) return
    try {
      await adminDeleteImage(productId, imageId)
      await refreshProduct()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-[#F5F5F4] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-[#F5F5F4] rounded-2xl animate-pulse" />)}</div>
          <div className="lg:col-span-2 space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-[#F5F5F4] rounded-2xl animate-pulse" />)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#F5F5F4] shadow-sm transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-head text-[1.4rem] font-bold text-[#1C1917]">
              {isEdit ? name || 'Edit Product' : 'New Product'}
            </h1>
            {isEdit && slug && <p className="text-[0.8rem] text-[#A8A29E] mt-0.5">/{slug}</p>}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] transition-all shadow-sm disabled:opacity-60 hover:-translate-y-0.5"
        >
          {saved ? <><Check size={15} /> Saved</> : saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Create Product'}</>}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
        {/* LEFT: Core Details */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-5 space-y-4">
          <SectionHeading>Product Details</SectionHeading>

          <Field label="Product Name" required>
            <input
              className={INPUT}
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (!isEdit || !slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                }
              }}
              placeholder="e.g. Ivory & Gold Pattupavadai Set"
            />
          </Field>

          <Field label="URL Slug" required>
            <input
              className={INPUT}
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="ivory-gold-pattupavadai-set"
            />
          </Field>

          <Field label="Description">
            <textarea
              className={`${INPUT} min-h-[100px] resize-none`}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the product — fabric, occasion, care instructions…"
            />
          </Field>
        </div>

        {/* RIGHT: Settings */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Status & Category */}
          <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-5 space-y-4">
            <SectionHeading>Settings</SectionHeading>

            <Field label="Status">
              <select className={INPUT} value={status} onChange={e => setStatus(e.target.value as any)}>
                <option value="draft">Draft — hidden from store</option>
                <option value="active">Active — visible in store</option>
                <option value="archived">Archived — permanently hidden</option>
              </select>
            </Field>

            <Field label="Category" required>
              <select className={INPUT} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Select a category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-5 space-y-4">
            <SectionHeading>Pricing</SectionHeading>

            <Field label="Base Price (₹)" required>
              <input
                type="number" min="0"
                className={INPUT}
                value={basePrice}
                onChange={e => setBasePrice(e.target.value)}
                placeholder="2499"
              />
            </Field>

            <Field label="Sale Price (₹)">
              <input
                type="number" min="0"
                className={INPUT}
                value={salePrice}
                onChange={e => setSalePrice(e.target.value)}
                placeholder="Optional — leave blank if no sale"
              />
            </Field>

            {salePrice && Number(salePrice) > 0 && Number(basePrice) > Number(salePrice) && (
              <div className="text-[0.78rem] font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                {Math.round(((Number(basePrice) - Number(salePrice)) / Number(basePrice)) * 100)}% discount applied
              </div>
            )}
          </div>

          {/* Flags */}
          <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-5 space-y-3">
            <SectionHeading>Labels</SectionHeading>
            <Toggle checked={isFeatured} onChange={() => setIsFeatured(v => !v)} label="Featured" />
            <Toggle checked={isBestSeller} onChange={() => setIsBestSeller(v => !v)} label="Best Seller" />
            <Toggle checked={isNewArrival} onChange={() => setIsNewArrival(v => !v)} label="New Arrival" />
          </div>
        </div>
      </div>

      {/* VARIANTS section — only available after product is created */}
      {!isEdit ? (
        <div className="bg-[#FAFAF9] rounded-2xl border border-dashed border-[#D6D3D1] p-6 text-center mb-5">
          <p className="text-[0.875rem] font-semibold text-[#78716C]">Save the product first to add variants and images.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeading>Variants</SectionHeading>
              <span className="text-[0.78rem] text-[#A8A29E]">{product?.variants?.filter(v => !v.deleted_at).length ?? 0} active</span>
            </div>

            {/* Existing variants */}
            {product?.variants?.filter(v => !v.deleted_at).length === 0 ? (
              <p className="text-[0.82rem] text-[#A8A29E] mb-4">No variants yet. Add a variant below.</p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F5F5F4]">
                      {['SKU', 'Size', 'Color', 'Price Override', 'Stock', ''].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-[0.72rem] font-bold text-[#A8A29E] uppercase tracking-[0.06em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F4]">
                    {product?.variants?.filter(v => !v.deleted_at).map(v => (
                      <tr key={v.id} className="hover:bg-[#FAFAF9]">
                        <td className="py-2.5 px-3"><span className="font-mono text-[0.8rem] font-bold text-[#1C1917] bg-[#F5F5F4] px-2 py-0.5 rounded">{v.sku}</span></td>
                        <td className="py-2.5 px-3 text-[0.85rem] text-[#44403C]">{v.size ?? '—'}</td>
                        <td className="py-2.5 px-3 text-[0.85rem] text-[#44403C]">{v.color ?? '—'}</td>
                        <td className="py-2.5 px-3 text-[0.85rem] text-[#44403C]">{v.price_override ? `₹${v.price_override.toLocaleString('en-IN')}` : '—'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[0.78rem] font-bold px-2 py-0.5 rounded-full ${(v.inventory?.stock_available ?? 0) > 0 ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                            {v.inventory?.stock_available ?? 0}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <button onClick={() => handleDeleteVariant(v.id)} className="p-1.5 text-[#A8A29E] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add variant row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 items-end">
              <Field label="SKU *">
                <input className={INPUT} placeholder="PATTU-GLD-2Y" value={newVariant.sku} onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))} />
              </Field>
              <Field label="Size">
                <input className={INPUT} placeholder="2-3 Yrs" value={newVariant.size} onChange={e => setNewVariant(v => ({ ...v, size: e.target.value }))} />
              </Field>
              <Field label="Color">
                <input className={INPUT} placeholder="Gold" value={newVariant.color} onChange={e => setNewVariant(v => ({ ...v, color: e.target.value }))} />
              </Field>
              <Field label="Price Override (₹)">
                <input type="number" className={INPUT} placeholder="Optional" value={newVariant.price_override} onChange={e => setNewVariant(v => ({ ...v, price_override: e.target.value }))} />
              </Field>
            </div>
            <button
              onClick={handleAddVariant}
              disabled={!newVariant.sku || addingVariant}
              className="mt-3 flex items-center gap-1.5 text-[0.82rem] font-bold text-[#C4654A] hover:text-[#A0523A] disabled:opacity-40 transition-colors"
            >
              <Plus size={14} /> {addingVariant ? 'Adding…' : 'Add Variant'}
            </button>
          </div>

          {/* IMAGES section */}
          <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeading>Images</SectionHeading>
              <span className="text-[0.78rem] text-[#A8A29E]">{product?.images?.length ?? 0} image{product?.images?.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Image grid */}
            {product?.images && product.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {product.images.sort((a, b) => a.sort_order - b.sort_order).map(img => (
                  <div key={img.id} className="group relative rounded-xl overflow-hidden border border-[#E7E5E4] bg-[#F5F5F4] aspect-square">
                    <Image src={img.public_url} alt="" fill className="object-cover" sizes="160px" />
                    {img.is_primary && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-white text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full">
                        <Star size={9} /> Primary
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {!img.is_primary && (
                        <button onClick={() => handleSetPrimary(img.id)} title="Set as primary" className="p-1.5 bg-white/90 rounded-lg text-amber-500 hover:bg-white transition-colors">
                          <Star size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDeleteImage(img.id)} title="Remove" className="p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-white transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add image */}
            <div className="flex gap-2">
              <input
                className={`${INPUT} flex-1`}
                placeholder="Paste image URL (Unsplash, CDN, etc.)…"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddImage()}
              />
              <button
                onClick={handleAddImage}
                disabled={!newImageUrl || addingImage}
                className="px-4 py-2.5 bg-[#C4654A] text-white rounded-xl text-[0.875rem] font-bold hover:bg-[#A0523A] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {addingImage ? 'Adding…' : 'Add Image'}
              </button>
            </div>
            <p className="text-[0.75rem] text-[#A8A29E] mt-2">Cloudflare R2 upload coming in Phase 5. For now paste a public URL.</p>
          </div>
        </>
      )}

      {/* Bottom save bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-4">
        <Link href="/admin/products" className="text-[0.875rem] font-semibold text-[#78716C] hover:text-[#44403C] transition-colors">
          ← Back to Products
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] transition-all shadow-sm disabled:opacity-60"
        >
          {saved ? <><Check size={15} /> Saved!</> : saving ? 'Saving…' : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Create Product'}</>}
        </button>
      </div>
    </div>
  )
}
