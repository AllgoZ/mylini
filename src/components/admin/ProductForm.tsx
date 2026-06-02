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

// Fix 4: bg-white + visible border for crisp contrast against page background
const INPUT = "w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#111827] outline-none focus:border-[#C4654A] focus:ring-2 focus:ring-[#C4654A]/10 transition-all placeholder:text-[#9CA3AF]"

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[0.8rem] font-bold text-[#6B7280] uppercase tracking-[0.08em] mb-4">
      {children}
    </h2>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.82rem] font-semibold text-[#374151]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// Fix 3: label on left, toggle on right — no label+button nesting
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[0.875rem] font-medium text-[#374151]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#C4654A]/30 ${checked ? 'bg-[#C4654A]' : 'bg-[#D1D5DB]'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

type PendingVariant = { _key: string; sku: string; size: string; color: string; price_override: string }

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

  // Core form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('active')
  const [basePrice, setBasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [isNewArrival, setIsNewArrival] = useState(false)

  // Fix 2: pending state for pre-save variants + images
  const [pendingVariants, setPendingVariants] = useState<PendingVariant[]>([])
  const [pendingImages, setPendingImages] = useState<string[]>([])

  // Live variant / image add forms (shown in both create and edit mode)
  const [newVariant, setNewVariant] = useState({ sku: '', size: '', color: '', price_override: '' })
  const [addingVariant, setAddingVariant] = useState(false)
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
        // Fix 2: create product then immediately batch-add pending variants + images
        const created = await adminCreateProduct(data)

        for (const v of pendingVariants) {
          await adminAddVariant(created.id, {
            sku: v.sku,
            size: v.size || undefined,
            color: v.color || undefined,
            price_override: v.price_override ? Number(v.price_override) : undefined,
            is_active: true,
          })
        }

        for (let i = 0; i < pendingImages.length; i++) {
          await adminAddImage(created.id, {
            public_url: pendingImages[i],
            sort_order: i,
            is_primary: i === 0,
          })
        }

        const variantMsg = pendingVariants.length ? ` + ${pendingVariants.length} variant${pendingVariants.length > 1 ? 's' : ''}` : ''
        const imageMsg = pendingImages.length ? ` + ${pendingImages.length} image${pendingImages.length > 1 ? 's' : ''}` : ''
        toast.success(`Product created${variantMsg}${imageMsg}`)
        router.replace(`/admin/products/${created.id}/edit`)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Variant handlers ─────────────────────────────────────────────────────────

  const handleAddVariantRow = () => {
    if (!newVariant.sku) return
    if (!isEdit) {
      // Create mode: buffer locally
      setPendingVariants(vs => [...vs, { ...newVariant, _key: String(Date.now()) }])
      setNewVariant({ sku: '', size: '', color: '', price_override: '' })
    } else {
      // Edit mode: call API
      handleAddVariantApi()
    }
  }

  const handleAddVariantApi = async () => {
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
      await refreshProduct()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // ─── Image handlers ──────────────────────────────────────────────────────────

  const handleAddImageRow = () => {
    if (!newImageUrl) return
    if (!isEdit) {
      setPendingImages(imgs => [...imgs, newImageUrl])
      setNewImageUrl('')
    } else {
      handleAddImageApi()
    }
  }

  const handleAddImageApi = async () => {
    if (!productId || !newImageUrl) return
    setAddingImage(true)
    try {
      await adminAddImage(productId, {
        public_url: newImageUrl,
        sort_order: product?.images?.length ?? 0,
        is_primary: !product?.images?.length,
      })
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

  // ─── Variant add row (shared between create and edit modes) ──────────────────

  const VariantAddRow = (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-2.5">
        <Field label="SKU *">
          <input className={INPUT} placeholder="PATTU-GLD-2Y" value={newVariant.sku}
            onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))} />
        </Field>
        <Field label="Size">
          <input className={INPUT} placeholder="2-3 Yrs" value={newVariant.size}
            onChange={e => setNewVariant(v => ({ ...v, size: e.target.value }))} />
        </Field>
        <Field label="Color">
          <input className={INPUT} placeholder="Gold" value={newVariant.color}
            onChange={e => setNewVariant(v => ({ ...v, color: e.target.value }))} />
        </Field>
        <Field label="Price Override (₹)">
          <input type="number" className={INPUT} placeholder="Optional" value={newVariant.price_override}
            onChange={e => setNewVariant(v => ({ ...v, price_override: e.target.value }))} />
        </Field>
      </div>
      <button
        onClick={handleAddVariantRow}
        disabled={!newVariant.sku || addingVariant}
        className="flex items-center gap-1.5 text-[0.82rem] font-bold text-[#C4654A] hover:text-[#A0523A] disabled:opacity-40 transition-colors"
      >
        <Plus size={14} /> {addingVariant ? 'Adding…' : 'Add Variant'}
      </button>
    </div>
  )

  // ─── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-[#F3F4F6] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-[#F3F4F6] rounded-2xl animate-pulse" />)}</div>
          <div className="lg:col-span-2 space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-[#F3F4F6] rounded-2xl animate-pulse" />)}</div>
        </div>
      </div>
    )
  }

  const saveButtonContent = saved
    ? <><Check size={15} /> Saved</>
    : saving
    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
    : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Create Product'}</>

  return (
    <div className="max-w-5xl mx-auto">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] shadow-sm transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-head text-[1.4rem] font-bold text-[#111827]">
              {isEdit ? name || 'Edit Product' : 'New Product'}
            </h1>
            {isEdit && slug && <p className="text-[0.8rem] text-[#9CA3AF] mt-0.5">/{slug}</p>}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] transition-all shadow-sm disabled:opacity-60 hover:-translate-y-0.5">
          {saveButtonContent}
        </button>
      </div>

      {/* ─── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

        {/* LEFT: Product Details */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-4">
          <SectionHeading>Product Details</SectionHeading>

          <Field label="Product Name" required>
            <input className={INPUT} value={name} onChange={e => {
              const v = e.target.value
              setName(v)
              if (!isEdit || !slug) {
                setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
              }
            }} placeholder="e.g. Ivory & Gold Pattupavadai Set" />
          </Field>

          <Field label="URL Slug" required>
            <input className={INPUT} value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="ivory-gold-pattupavadai-set" />
          </Field>

          <Field label="Description">
            <textarea className={`${INPUT} min-h-[100px] resize-none`} value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Fabric, occasion, care instructions…" />
          </Field>
        </div>

        {/* RIGHT: Settings + Pricing + Labels */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Status & Category */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-4">
            <SectionHeading>Organization</SectionHeading>
            <Field label="Status">
              <select className={INPUT} value={status} onChange={e => setStatus(e.target.value as any)}>
                <option value="active">Active — visible on storefront</option>
                <option value="draft">Draft — hidden from storefront</option>
                <option value="archived">Archived — permanently hidden</option>
              </select>
              {status === 'draft' && (
                <p className="text-[0.75rem] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-1">
                  This product is hidden from the storefront. Set to Active to publish it.
                </p>
              )}
            </Field>
            <Field label="Category" required>
              <select className={INPUT} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Select a category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-4">
            <SectionHeading>Pricing</SectionHeading>
            <Field label="Base Price (₹)" required>
              <input type="number" min="0" className={INPUT} value={basePrice}
                onChange={e => setBasePrice(e.target.value)} placeholder="2499" />
            </Field>
            <Field label="Sale Price (₹)">
              <input type="number" min="0" className={INPUT} value={salePrice}
                onChange={e => setSalePrice(e.target.value)} placeholder="Optional" />
            </Field>
            {salePrice && Number(salePrice) > 0 && Number(basePrice) > Number(salePrice) && (
              <div className="text-[0.78rem] font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                {Math.round(((Number(basePrice) - Number(salePrice)) / Number(basePrice)) * 100)}% discount
              </div>
            )}
          </div>

          {/* Labels — Fix 3: toggle restructured */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
            <SectionHeading>Labels</SectionHeading>
            <div className="flex flex-col gap-2">
              <Toggle checked={isFeatured} onChange={() => setIsFeatured(v => !v)} label="Featured" />
              <Toggle checked={isBestSeller} onChange={() => setIsBestSeller(v => !v)} label="Best Seller" />
              <Toggle checked={isNewArrival} onChange={() => setIsNewArrival(v => !v)} label="New Arrival" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Variants Section — Fix 2: always visible ────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeading>Variants</SectionHeading>
          <span className="text-[0.78rem] text-[#9CA3AF]">
            {isEdit
              ? `${product?.variants?.filter(v => !v.deleted_at).length ?? 0} saved`
              : pendingVariants.length > 0 ? `${pendingVariants.length} pending` : 'none yet'}
          </span>
        </div>

        {/* Edit mode: show saved variants from API */}
        {isEdit && (product?.variants?.filter(v => !v.deleted_at).length ?? 0) > 0 && (
          <div className="overflow-x-auto mb-4 border border-[#F3F4F6] rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                  {['SKU', 'Size', 'Color', 'Price Override', 'Stock', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[0.72rem] font-bold text-[#6B7280] uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9FAFB]">
                {product?.variants?.filter(v => !v.deleted_at).map(v => (
                  <tr key={v.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-2.5 px-3"><span className="font-mono text-[0.8rem] font-bold text-[#111827] bg-[#F3F4F6] px-2 py-0.5 rounded">{v.sku}</span></td>
                    <td className="py-2.5 px-3 text-[0.85rem] text-[#374151]">{v.size ?? '—'}</td>
                    <td className="py-2.5 px-3 text-[0.85rem] text-[#374151]">{v.color ?? '—'}</td>
                    <td className="py-2.5 px-3 text-[0.85rem] text-[#374151]">{v.price_override ? `₹${v.price_override.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[0.78rem] font-bold px-2 py-0.5 rounded-full ${(v.inventory?.stock_available ?? 0) > 0 ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {v.inventory?.stock_available ?? 0}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => handleDeleteVariant(v.id)} className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create mode: show pending variants */}
        {!isEdit && pendingVariants.length > 0 && (
          <div className="overflow-x-auto mb-4 border border-[#E5E7EB] rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                  {['SKU', 'Size', 'Color', 'Price Override', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[0.72rem] font-bold text-[#6B7280] uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9FAFB]">
                {pendingVariants.map(v => (
                  <tr key={v._key} className="hover:bg-[#F9FAFB]">
                    <td className="py-2.5 px-3"><span className="font-mono text-[0.8rem] font-bold text-[#111827] bg-[#F3F4F6] px-2 py-0.5 rounded">{v.sku}</span></td>
                    <td className="py-2.5 px-3 text-[0.85rem] text-[#374151]">{v.size || '—'}</td>
                    <td className="py-2.5 px-3 text-[0.85rem] text-[#374151]">{v.color || '—'}</td>
                    <td className="py-2.5 px-3 text-[0.85rem] text-[#374151]">{v.price_override ? `₹${Number(v.price_override).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setPendingVariants(vs => vs.filter(x => x._key !== v._key))}
                        className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add variant row — same in both modes */}
        <div className="pt-1">
          {VariantAddRow}
        </div>
      </div>

      {/* ─── Images Section — Fix 2: always visible ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeading>Images</SectionHeading>
          <span className="text-[0.78rem] text-[#9CA3AF]">
            {isEdit
              ? `${product?.images?.length ?? 0} saved`
              : pendingImages.length > 0 ? `${pendingImages.length} pending` : 'none yet'}
          </span>
        </div>

        {/* Edit mode: saved images grid */}
        {isEdit && product?.images && product.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            {product.images.sort((a, b) => a.sort_order - b.sort_order).map(img => (
              <div key={img.id} className="group relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] aspect-square">
                <Image src={img.public_url} alt="" fill className="object-cover" sizes="140px" />
                {img.is_primary && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-400 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full">
                    <Star size={8} /> Primary
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                  {!img.is_primary && (
                    <button onClick={() => handleSetPrimary(img.id)} title="Set as primary"
                      className="p-1.5 bg-white/90 rounded-lg text-amber-500 hover:bg-white transition-colors">
                      <Star size={13} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteImage(img.id)} title="Remove"
                    className="p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-white transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create mode: pending images preview */}
        {!isEdit && pendingImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            {pendingImages.map((url, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-400 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full">
                    <Star size={8} /> Primary
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button onClick={() => setPendingImages(imgs => imgs.filter((_, j) => j !== i))}
                    className="p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-white transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add image URL row */}
        <div className="flex gap-2">
          <input
            className={`${INPUT} flex-1`}
            placeholder="Paste image URL…"
            value={newImageUrl}
            onChange={e => setNewImageUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddImageRow()}
          />
          <button onClick={handleAddImageRow} disabled={!newImageUrl || addingImage}
            className="px-4 py-2.5 bg-[#C4654A] text-white rounded-xl text-[0.875rem] font-bold hover:bg-[#A0523A] transition-colors disabled:opacity-50 whitespace-nowrap">
            {addingImage ? 'Adding…' : 'Add Image'}
          </button>
        </div>
        <p className="text-[0.75rem] text-[#9CA3AF] mt-2">Paste a public image URL. R2 upload coming in Phase 5.</p>
      </div>

      {/* ─── Bottom action bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4">
        <Link href="/admin/products" className="text-[0.875rem] font-semibold text-[#6B7280] hover:text-[#374151] transition-colors">
          ← Back to Products
        </Link>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] transition-all shadow-sm disabled:opacity-60">
          {saveButtonContent}
        </button>
      </div>

    </div>
  )
}
