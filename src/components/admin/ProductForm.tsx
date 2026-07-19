'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Plus, Trash2, Star, Save, Check, ExternalLink,
  Bold, Italic, List, Heading2, X, Eye, ChevronRight
} from 'lucide-react'
import {
  adminCreateProduct, adminUpdateProduct, adminGetProduct,
  adminAddVariant, adminDeleteVariant,
  adminAddImage, adminDeleteImage, adminUpdateImage,
  adminReplaceAttributes, adminUploadImage,
} from '@/lib/api/admin/products'
import { ImageUploader } from '@/components/admin/ImageUploader'
import type { PendingUpload } from '@/components/admin/ImageUploader'
import { adminAdjustStock } from '@/lib/api/admin/inventory'
import { adminCreateCategory } from '@/lib/api/admin/categories'
import { getCategories } from '@/lib/api/categories'
import type { ProductWithVariants, ProductImage } from '@/types/product'
import type { CategoryTree } from '@/lib/api/categories'
import { toast } from 'sonner'

const INPUT = "w-full bg-white border-[1.5px] border-[#D1D5DB] rounded-xl px-4 py-3 text-[0.9rem] text-[#111827] outline-none focus:border-[#C4654A] focus:ring-2 focus:ring-[#C4654A]/10 transition-all placeholder:text-[#9CA3AF]"
const SECTION = "bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[0.85rem] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-4">{children}</h2>
}

function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[0.875rem] font-semibold text-[#374151]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[0.75rem] text-[#9CA3AF]">{hint}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: () => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <div>
        <span className="text-[0.875rem] font-medium text-[#374151]">{label}</span>
        {description && <p className="text-[0.72rem] text-[#9CA3AF]">{description}</p>}
      </div>
      <button
        type="button" role="switch" aria-checked={checked} onClick={onChange}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#C4654A]/30 ${checked ? 'bg-[#C4654A]' : 'bg-[#D1D5DB]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

// Simple rich text toolbar using contentEditable — no dependencies
function RichTextEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const lastValue = useRef('')

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && lastValue.current !== value) {
      ref.current.innerHTML = value
      lastValue.current = value
    }
  }, [value])

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg)
    ref.current?.focus()
  }

  return (
    <div className="border border-[#D1D5DB] rounded-xl overflow-hidden focus-within:border-[#C4654A] focus-within:ring-2 focus-within:ring-[#C4654A]/10 transition-all">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#F3F4F6] bg-[#F9FAFB]">
        {[
          { icon: <Bold size={13} />, cmd: 'bold', title: 'Bold' },
          { icon: <Italic size={13} />, cmd: 'italic', title: 'Italic' },
          { icon: <Heading2 size={13} />, cmd: 'formatBlock', arg: 'h3', title: 'Heading' },
          { icon: <List size={13} />, cmd: 'insertUnorderedList', title: 'List' },
        ].map(({ icon, cmd, arg, title }) => (
          <button key={cmd + (arg ?? '')} type="button" title={title} onMouseDown={e => { e.preventDefault(); exec(cmd, arg) }}
            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827] transition-colors">
            {icon}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          const html = ref.current?.innerHTML ?? ''
          lastValue.current = html
          onChange(html)
        }}
        className="min-h-[120px] px-3.5 py-2.5 text-[0.875rem] text-[#111827] outline-none prose prose-sm max-w-none [&>h3]:font-bold [&>h3]:text-[0.95rem] [&>ul]:list-disc [&>ul]:pl-5"
      />
    </div>
  )
}

// Google-style SEO preview card
function SeoPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  const displayTitle = title || 'Product Title'
  const displayDesc = description || 'Product description will appear here in search results.'
  const displaySlug = slug ? `mylini.com/product/${slug}` : 'mylini.com/product/your-slug'
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <p className="text-[0.7rem] font-bold text-[#6B7280] uppercase tracking-[0.08em] mb-3">Search Preview</p>
      <p className="text-[0.75rem] text-[#666] mb-0.5 truncate">{displaySlug}</p>
      <p className="text-[1rem] text-[#1A0DAB] font-medium mb-1 line-clamp-1 hover:underline cursor-pointer">{displayTitle}</p>
      <p className="text-[0.82rem] text-[#4D5156] line-clamp-2">{displayDesc}</p>
    </div>
  )
}

type PendingVariant = { _key: string; sku: string; size: string; color: string; price_override: string; stock: string }
type AttrRow = { _key: string; id?: string; key: string; value: string }
type VariantOption = { _key: string; name: string; vals: string[]; inputDraft: string }

const OPTION_SUGGESTIONS = ['Size', 'Color', 'Material', 'Age Group']

const COMMON_ATTRS = ['Fabric', 'Occasion', 'Fit', 'Care Instructions', 'Sleeve Type', 'Material', 'Pattern', 'Age Group']

interface Props { productId?: string }

export function ProductForm({ productId }: Props) {
  const router = useRouter()
  const isEdit = !!productId

  const [product, setProduct] = useState<ProductWithVariants | null>(null)
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [featuredCategoryOptions, setFeaturedCategoryOptions] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Core fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [featuredCategoryId, setFeaturedCategoryId] = useState('')
  const [status, setStatus] = useState<string>('active')
  const [basePrice, setBasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [isNewArrival, setIsNewArrival] = useState(false)

  // Organization extras
  const [productType, setProductType] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [chargeTax, setChargeTax] = useState(true)

  // SEO
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // Size chart
  const [sizeChartUrl, setSizeChartUrl] = useState('')
  const [sizeChartUploading, setSizeChartUploading] = useState(false)

  // Category creation
  const [showNewCatForm, setShowNewCatForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatParentId, setNewCatParentId] = useState('')
  const [creatingCat, setCreatingCat] = useState(false)

  // Inline stock editing (variantId → draft value)
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({})
  const [stockSaving, setStockSaving] = useState<Record<string, boolean>>({})

  // Dimensions
  const [weightGrams, setWeightGrams] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')

  // Attributes (key-value rows)
  const [attrs, setAttrs] = useState<AttrRow[]>([])

  // Images
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [savedImages, setSavedImages] = useState<ProductImage[]>([])

  // Variant generator
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([
    { _key: 'size', name: 'Size', vals: [], inputDraft: '' },
  ])
  const [pendingVariants, setPendingVariants] = useState<PendingVariant[]>([])
  const [addingVariant, setAddingVariant] = useState(false)
  const [newVariant, setNewVariant] = useState({ sku: '', size: '', color: '', price_override: '', stock: '0' })

  const dirty = useCallback(() => setIsDirty(true), [])

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  useEffect(() => {
    // Full tree (parents + children), not flattened — a flatMap that dropped any parent
    // with children used to make top-level categories unselectable the moment they had
    // sub-categories at all.
    getCategories().then(setCategories)

    // Featured Category options come from the existing Content -> Featured Categories
    // CMS list (same endpoint that admin page already uses) — no separate management UI.
    fetch('/api/admin/content/sections', { credentials: 'include' })
      .then(r => r.json())
      .then(j => setFeaturedCategoryOptions(
        ((j.data as { id: string; title: string | null; section_type: string; is_active: boolean }[]) ?? [])
          .filter(s => s.section_type === 'featured_category' && s.is_active)
          .map(s => ({ id: s.id, title: s.title ?? 'Untitled' }))
      ))
      .catch(() => {})

    if (productId) {
      adminGetProduct(productId)
        .then(p => {
          setProduct(p)
          setSavedImages(p.images ?? [])
          setName(p.name)
          setSlug(p.slug)
          setDescription(p.description ?? '')
          setCategoryId(p.category?.id ?? '')
          setFeaturedCategoryId((p as any).featured_category_id ?? '')
          setStatus(p.status)
          setBasePrice(String(p.base_price))
          setSalePrice(String(p.sale_price ?? ''))
          setIsFeatured(p.is_featured)
          setIsBestSeller(p.is_best_seller)
          setIsNewArrival(p.is_new_arrival)
          setMetaTitle((p as any).meta_title ?? '')
          setMetaDescription((p as any).meta_description ?? '')
          setWeightGrams(String((p as any).weight_grams ?? ''))
          setLengthCm(String((p as any).length_cm ?? ''))
          setWidthCm(String((p as any).width_cm ?? ''))
          setHeightCm(String((p as any).height_cm ?? ''))
          setSizeChartUrl((p as any).size_chart_url ?? '')
          setProductType((p as any).product_type ?? '')
          setTags((p as any).tags ?? [])
          setChargeTax((p as any).charge_tax ?? true)
          if (p.attributes?.length) {
            setAttrs(p.attributes.map((a: any) => ({ _key: a.id, id: a.id, key: a.key, value: a.value })))
          }
        })
        .catch(e => toast.error(e.message))
        .finally(() => setLoading(false))
    }
  }, [productId])

  const refreshProduct = async () => {
    if (!productId) return
    const p = await adminGetProduct(productId)
    setProduct(p)
    setSavedImages(p.images ?? [])
  }

  // ─── Auto slug ───────────────────────────────────────────────────────────────
  const handleNameChange = (v: string) => {
    setName(v); dirty()
    if (!isEdit) setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name || !slug || !categoryId || !basePrice) {
      toast.error('Fill in required fields: Name, Slug, Category, Base Price')
      return
    }
    setSaving(true)
    try {
      const data: any = {
        name, slug,
        description: description || undefined,
        category_id: categoryId,
        featured_category_id: featuredCategoryId || null,
        base_price: Number(basePrice),
        sale_price: salePrice ? Number(salePrice) : null,
        is_featured: isFeatured, is_best_seller: isBestSeller, is_new_arrival: isNewArrival,
        status,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        weight_grams: weightGrams ? Number(weightGrams) : null,
        length_cm: lengthCm ? Number(lengthCm) : null,
        width_cm: widthCm ? Number(widthCm) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        size_chart_url: sizeChartUrl || null,
        product_type: productType || null,
        tags,
        charge_tax: chargeTax,
      }

      let targetId = productId

      if (isEdit && productId) {
        await adminUpdateProduct(productId, data)
      } else {
        const created = await adminCreateProduct(data)
        targetId = created.id

        // Merge staged pending variants + any unstaged generator preview
        const stagedSkus = new Set(pendingVariants.map(v => v.sku))
        const allVariants = [
          ...pendingVariants,
          ...livePreview.filter(v => !stagedSkus.has(v.sku)),
        ]
        for (const v of allVariants) {
          await adminAddVariant(created.id, {
            sku: v.sku, size: v.size || undefined, color: v.color || undefined,
            price_override: v.price_override ? Number(v.price_override) : undefined,
            initial_stock: v.stock ? Number(v.stock) : 0,
            is_active: true,
          })
        }
        // Upload pending files to Cloudinary then register in DB
        for (let i = 0; i < pendingUploads.length; i++) {
          const item = pendingUploads[i]
          if (item.status === 'error') continue
          try {
            const { main } = await adminUploadImage(item.file, created.id, i === 0 ? 'main' : 'gallery')
            await adminAddImage(created.id, {
              public_url: main.public_url,
              storage_key: main.storage_key,
              storage_provider: main.storage_provider,
              width: main.width,
              height: main.height,
              sort_order: i,
              is_primary: i === 0,
            })
          } catch { /* non-fatal — product still saved */ }
        }
      }

      // Save attributes (replace-all approach)
      if (targetId) {
        const cleanAttrs = attrs.filter(a => a.key.trim() && a.value.trim()).map(a => ({ key: a.key.trim(), value: a.value.trim() }))
        await adminReplaceAttributes(targetId, cleanAttrs)
      }

      setIsDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast.success(isEdit ? 'Product saved' : 'Product created')
      if (!isEdit && targetId) router.replace(`/admin/products/${targetId}/edit`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Variant generator ────────────────────────────────────────────────────────
  const computeVariants = (options: VariantOption[]): PendingVariant[] => {
    const optionSets = options
      .map(o => ({ name: o.name.trim(), vals: o.vals.filter(Boolean) }))
      .filter(o => o.name && o.vals.length > 0)
    if (optionSets.length === 0) return []

    const combos: string[][] = optionSets.reduce<string[][]>((acc, opt) => {
      if (acc.length === 0) return opt.vals.map(v => [v])
      return acc.flatMap(a => opt.vals.map(v => [...a, v]))
    }, [])

    const productPrefix = slug ? slug.slice(0, 8).toUpperCase() : 'PROD'
    return combos.map(combo => {
      const size = optionSets[0] ? combo[0] : ''
      const color = optionSets[1] ? combo[1] : ''
      const skuParts = combo.map(v => v.slice(0, 4).toUpperCase().replace(/\s+/g, ''))
      return { _key: String(Date.now()) + Math.random(), sku: `${productPrefix}-${skuParts.join('-')}`, size, color, price_override: '', stock: '0' }
    })
  }

  // Live preview — derived from current variantOptions
  const livePreview = computeVariants(variantOptions)

  const confirmGeneratedVariants = () => {
    const variants = livePreview
    if (variants.length === 0) return
    if (!isEdit) {
      setPendingVariants(prev => [...prev, ...variants])
      // Reset options after adding
      setVariantOptions([{ _key: String(Date.now()), name: 'Size', vals: [], inputDraft: '' }])
      dirty()
    } else {
      handleBatchAddVariants(variants)
    }
  }

  const handleBatchAddVariants = async (variants: PendingVariant[]) => {
    if (!productId) return
    setAddingVariant(true)
    let savedCount = 0
    try {
      for (const v of variants) {
        await adminAddVariant(productId, {
          sku: v.sku, size: v.size || undefined, color: v.color || undefined,
          price_override: v.price_override ? Number(v.price_override) : undefined,
          initial_stock: v.stock ? Number(v.stock) : 0,
          is_active: true,
        })
        savedCount++
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAddingVariant(false)
    }
    if (savedCount > 0) {
      setVariantOptions([{ _key: String(Date.now()), name: 'Size', vals: [], inputDraft: '' }])
      toast.success(`${savedCount} variant${savedCount !== 1 ? 's' : ''} added`)
      // Refresh table — errors here are non-fatal (variants are already in DB)
      refreshProduct().catch(() => null)
    }
  }

  const handleAddVariantRow = () => {
    if (!newVariant.sku) return
    if (!isEdit) {
      setPendingVariants(vs => [...vs, { ...newVariant, _key: String(Date.now()) }])
      setNewVariant({ sku: '', size: '', color: '', price_override: '', stock: '0' })
      dirty()
    } else handleAddVariantApi()
  }

  const handleAddVariantApi = async () => {
    if (!productId || !newVariant.sku) return
    setAddingVariant(true)
    try {
      await adminAddVariant(productId, {
        sku: newVariant.sku, size: newVariant.size || undefined, color: newVariant.color || undefined,
        price_override: newVariant.price_override ? Number(newVariant.price_override) : undefined,
        initial_stock: newVariant.stock ? Number(newVariant.stock) : 0,
        is_active: true,
      })
      toast.success('Variant added')
      setNewVariant({ sku: '', size: '', color: '', price_override: '', stock: '0' })
    } catch (e: any) { toast.error(e.message) }
    finally { setAddingVariant(false) }
    refreshProduct().catch(() => null)
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!productId || !confirm('Delete this variant?')) return
    try {
      await adminDeleteVariant(productId, variantId)
      await refreshProduct()
    } catch (e: any) { toast.error(e.message) }
  }

  // ─── Attribute helpers ────────────────────────────────────────────────────────
  // ─── Create category ─────────────────────────────────────────────────────────
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    setCreatingCat(true)
    try {
      const cat = await adminCreateCategory(newCatName.trim(), newCatParentId || undefined)
      setCategories(prev => [...prev, cat as any])
      setCategoryId(cat.id)
      setNewCatName('')
      setNewCatParentId('')
      setShowNewCatForm(false)
      toast.success(`Category "${cat.name}" created`)
      dirty()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreatingCat(false)
    }
  }

  // ─── Inline stock save ────────────────────────────────────────────────────────
  const handleSaveStock = async (variantId: string) => {
    const val = stockEdits[variantId]
    if (val === undefined || val === '') return
    const newStock = Number(val)
    if (isNaN(newStock) || newStock < 0) { toast.error('Invalid stock value'); return }
    setStockSaving(prev => ({ ...prev, [variantId]: true }))
    try {
      await adminAdjustStock(variantId, newStock, 'adjustment')
      toast.success('Stock updated')
      setStockEdits(prev => { const n = { ...prev }; delete n[variantId]; return n })
      await refreshProduct()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setStockSaving(prev => ({ ...prev, [variantId]: false }))
    }
  }

  // ─── Attribute helpers ────────────────────────────────────────────────────────
  const addAttrRow = (key = '') => {
    setAttrs(prev => [...prev, { _key: String(Date.now()), key, value: '' }])
    dirty()
  }
  const updateAttr = (k: string, field: 'key' | 'value', val: string) => {
    setAttrs(prev => prev.map(a => a._key === k ? { ...a, [field]: val } : a))
    dirty()
  }
  const removeAttr = (k: string) => { setAttrs(prev => prev.filter(a => a._key !== k)); dirty() }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-[#F3F4F6] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#F3F4F6] rounded-2xl animate-pulse" />)}</div>
          <div className="lg:col-span-2 space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-[#F3F4F6] rounded-2xl animate-pulse" />)}</div>
        </div>
      </div>
    )
  }

  const discount = salePrice && basePrice && Number(salePrice) > 0 && Number(basePrice) > Number(salePrice)
    ? Math.round(((Number(basePrice) - Number(salePrice)) / Number(basePrice)) * 100) : null

  const SaveBtn = ({ size = 'default' }: { size?: 'default' | 'sm' }) => (
    <button onClick={handleSave} disabled={saving}
      className={`flex items-center gap-2 rounded-xl bg-[#C4654A] text-white font-bold hover:bg-[#A0523A] transition-all shadow-sm disabled:opacity-60 hover:-translate-y-0.5 ${size === 'sm' ? 'px-4 py-2 text-[0.82rem]' : 'px-5 py-2.5 text-[0.875rem]'}`}>
      {saved ? <><Check size={14} /> Saved</> : saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save size={14} /> {isEdit ? 'Save Changes' : 'Create Product'}</>}
    </button>
  )

  return (
    <div className="max-w-5xl mx-auto pb-10">

      {/* Sticky dirty bar */}
      {isDirty && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-[#1C1917] text-white px-6 py-3 shadow-lg">
          <p className="text-[0.85rem] font-medium">You have unsaved changes</p>
          <div className="flex items-center gap-2">
            <button onClick={() => { setIsDirty(false); window.location.reload() }}
              className="px-4 py-1.5 text-[0.82rem] font-semibold text-white/70 hover:text-white border border-white/20 rounded-lg transition-colors">
              Discard
            </button>
            <SaveBtn size="sm" />
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] shadow-sm transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-body text-[1.35rem] font-bold text-[#111827] tracking-tight">
              {isEdit ? name || 'Edit Product' : 'New Product'}
            </h1>
            {isEdit && slug && <p className="text-[0.8rem] text-[#9CA3AF] mt-0.5">/{slug}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && slug && (
            <a href={`/product/${slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] text-[0.875rem] font-semibold hover:bg-[#F9FAFB] transition-colors shadow-sm">
              <Eye size={14} /> Preview
            </a>
          )}
          <SaveBtn />
        </div>
      </div>

      {/* ─── Main grid ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

        {/* LEFT: Details, Attributes, Dimensions, SEO */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* Product Details */}
          <div className={SECTION + ' space-y-4'}>
            <SectionHeading>Product Details</SectionHeading>
            <Field label="Product Name" required>
              <input className={INPUT} value={name} onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Ivory & Gold Pattupavadai Set" />
            </Field>
            <Field label="URL Slug" required hint="Lowercase letters, numbers, hyphens only">
              <input className={INPUT} value={slug}
                onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); dirty() }}
                placeholder="ivory-gold-pattupavadai-set" />
            </Field>
            <Field label="Description">
              <RichTextEditor value={description} onChange={v => { setDescription(v); dirty() }} />
            </Field>
          </div>

          {/* Product Attributes */}
          <div className={SECTION}>
            <SectionHeading>Product Attributes</SectionHeading>
            {attrs.length === 0 ? (
              <div className="py-6 text-center border-2 border-dashed border-[#E5E7EB] rounded-xl mb-3">
                <p className="text-[0.85rem] text-[#9CA3AF] mb-3">No attributes yet. Add fabric, occasion, care instructions…</p>
                <button onClick={() => addAttrRow()}
                  className="inline-flex items-center gap-1.5 text-[0.82rem] font-bold text-[#C4654A] hover:text-[#A0523A] transition-colors">
                  <Plus size={14} /> Add First Attribute
                </button>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {attrs.map(a => (
                  <div key={a._key} className="flex gap-2 items-center">
                    <input className={INPUT + ' flex-1'} placeholder="Key (e.g. Fabric)" value={a.key}
                      onChange={e => updateAttr(a._key, 'key', e.target.value)} list="attr-keys" />
                    <input className={INPUT + ' flex-1'} placeholder="Value (e.g. Pure Silk)" value={a.value}
                      onChange={e => updateAttr(a._key, 'value', e.target.value)} />
                    <button onClick={() => removeAttr(a._key)} className="p-2 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <datalist id="attr-keys">{COMMON_ATTRS.map(k => <option key={k} value={k} />)}</datalist>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => addAttrRow()}
                className="flex items-center gap-1.5 text-[0.82rem] font-bold text-[#C4654A] hover:text-[#A0523A] transition-colors">
                <Plus size={14} /> Add Attribute
              </button>
              <span className="text-[#E5E7EB]">|</span>
              {COMMON_ATTRS.slice(0, 4).map(k => (
                <button key={k} onClick={() => addAttrRow(k)}
                  className="text-[0.75rem] px-2.5 py-1 bg-[#F3F4F6] text-[#6B7280] rounded-lg hover:bg-[#E5E7EB] transition-colors">
                  + {k}
                </button>
              ))}
            </div>
          </div>

          {/* Size Chart */}
          <div className={SECTION + ' space-y-4'}>
            <SectionHeading>Size Chart</SectionHeading>
            {sizeChartUrl ? (
              <div className="flex items-start gap-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sizeChartUrl} alt="Size chart preview" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8rem] font-semibold text-[#374151] mb-0.5">Size chart uploaded</p>
                  <a href={sizeChartUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[0.75rem] text-[#C4654A] hover:underline flex items-center gap-1">
                    <ExternalLink size={11} /> View full size
                  </a>
                  <label className="mt-2 flex items-center gap-1.5 text-[0.75rem] font-semibold text-[#6B7280] hover:text-[#374151] cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setSizeChartUploading(true)
                        try {
                          const { main } = await adminUploadImage(file, productId || `temp-${Date.now()}`, 'size_chart')
                          setSizeChartUrl(main.public_url)
                          dirty()
                        } catch (err: any) {
                          toast.error(`Upload failed: ${err.message}`)
                        } finally {
                          setSizeChartUploading(false)
                        }
                        e.target.value = ''
                      }}
                    />
                    Replace image
                  </label>
                </div>
                <button onClick={() => { setSizeChartUrl(''); dirty() }}
                  className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${sizeChartUploading ? 'border-[#C4654A] bg-[#FFF7F5]' : 'border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#C4654A] hover:bg-[#FFF7F5]'}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={sizeChartUploading}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setSizeChartUploading(true)
                    try {
                      const { main } = await adminUploadImage(file, productId || `temp-${Date.now()}`, 'size_chart')
                      setSizeChartUrl(main.public_url)
                      dirty()
                    } catch (err: any) {
                      toast.error(`Upload failed: ${err.message}`)
                    } finally {
                      setSizeChartUploading(false)
                    }
                    e.target.value = ''
                  }}
                />
                {sizeChartUploading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-[#C4654A]/30 border-t-[#C4654A] rounded-full animate-spin" />
                    <p className="text-[0.85rem] font-semibold text-[#C4654A]">Uploading…</p>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📏</span>
                    <div className="text-center">
                      <p className="text-[0.875rem] font-semibold text-[#374151]">Upload size chart image</p>
                      <p className="text-[0.75rem] text-[#9CA3AF] mt-0.5">JPG, PNG, or WEBP · max 10 MB</p>
                    </div>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Dimensions */}
          <div className={SECTION + ' space-y-4'}>
            <SectionHeading>Shipping Dimensions</SectionHeading>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Weight (grams)" hint="For shipping calculation">
                <input type="number" min="0" className={INPUT} value={weightGrams}
                  onChange={e => { setWeightGrams(e.target.value); dirty() }} placeholder="250" />
              </Field>
              <Field label="Length (cm)">
                <input type="number" min="0" step="0.1" className={INPUT} value={lengthCm}
                  onChange={e => { setLengthCm(e.target.value); dirty() }} placeholder="30" />
              </Field>
              <Field label="Width (cm)">
                <input type="number" min="0" step="0.1" className={INPUT} value={widthCm}
                  onChange={e => { setWidthCm(e.target.value); dirty() }} placeholder="20" />
              </Field>
              <Field label="Height (cm)">
                <input type="number" min="0" step="0.1" className={INPUT} value={heightCm}
                  onChange={e => { setHeightCm(e.target.value); dirty() }} placeholder="5" />
              </Field>
            </div>
          </div>

          {/* SEO */}
          <div className={SECTION + ' space-y-4'}>
            <SectionHeading>SEO</SectionHeading>
            <Field label="Meta Title" hint={`${metaTitle.length}/200 chars`}>
              <input className={INPUT} value={metaTitle} maxLength={200}
                onChange={e => { setMetaTitle(e.target.value); dirty() }}
                placeholder={name || 'Product title for search engines'} />
            </Field>
            <Field label="Meta Description" hint={`${metaDescription.length}/500 chars`}>
              <textarea className={`${INPUT} min-h-[80px] resize-none`} value={metaDescription} maxLength={500}
                onChange={e => { setMetaDescription(e.target.value); dirty() }}
                placeholder="Short description for search engine results (150–160 chars recommended)" />
            </Field>
            <SeoPreview title={metaTitle || name} description={metaDescription} slug={slug} />
          </div>
        </div>

        {/* RIGHT: Organization, Pricing, Visibility */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Organization */}
          <div className={SECTION + ' space-y-4'}>
            <SectionHeading>Organization</SectionHeading>
            <Field label="Product Type" hint="e.g. Skirt & Top, Frock, Dhoti Set">
              <input className={INPUT} value={productType}
                onChange={e => { setProductType(e.target.value); dirty() }}
                placeholder="e.g. Skirt & Top" />
            </Field>
            <Field label="Status">
              <select className={INPUT} value={status} onChange={e => { setStatus(e.target.value); dirty() }}>
                <option value="active">Active — visible on storefront</option>
                <option value="draft">Draft — hidden from storefront</option>
                <option value="hidden">Hidden — unlisted, URL-only</option>
                <option value="scheduled">Scheduled — publish later</option>
                <option value="archived">Archived — permanently hidden</option>
              </select>
              {status === 'draft' && (
                <p className="text-[0.75rem] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-1">
                  Hidden from storefront. Set to Active to publish.
                </p>
              )}
            </Field>
            <Field label="Category" required>
              <select className={INPUT} value={categoryId} onChange={e => {
                if (e.target.value === '__new__') { setShowNewCatForm(true); return }
                setCategoryId(e.target.value); dirty()
              }}>
                <option value="">Select a category…</option>
                {categories.map(c => (
                  <Fragment key={c.id}>
                    <option value={c.id}>{c.name}</option>
                    {(c.children ?? []).map(child => (
                      <option key={child.id} value={child.id}>— {child.name}</option>
                    ))}
                  </Fragment>
                ))}
                <option value="__new__">+ Create new category…</option>
              </select>
              {showNewCatForm && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex gap-2 items-center">
                    <input
                      autoFocus
                      className={INPUT + ' flex-1'}
                      placeholder="New category name…"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateCategory(); if (e.key === 'Escape') { setShowNewCatForm(false); setNewCatName(''); setNewCatParentId('') } }}
                    />
                    <button onClick={handleCreateCategory} disabled={!newCatName.trim() || creatingCat}
                      className="px-3.5 py-2.5 bg-[#C4654A] text-white text-[0.82rem] font-bold rounded-xl hover:bg-[#A0523A] disabled:opacity-50 transition-colors whitespace-nowrap">
                      {creatingCat ? 'Creating…' : 'Create'}
                    </button>
                    <button onClick={() => { setShowNewCatForm(false); setNewCatName(''); setNewCatParentId('') }}
                      className="p-2.5 text-[#9CA3AF] hover:text-[#374151] border border-[#E5E7EB] rounded-xl transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <select
                    className={INPUT}
                    value={newCatParentId}
                    onChange={e => setNewCatParentId(e.target.value)}
                  >
                    <option value="">Top-level category (e.g. Boys, Girls)</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>Sub-category under &quot;{c.name}&quot;</option>
                    ))}
                  </select>
                </div>
              )}
            </Field>
            <Field label="Featured Category (optional)">
              <select className={INPUT} value={featuredCategoryId} onChange={e => {
                setFeaturedCategoryId(e.target.value); dirty()
              }}>
                <option value="">None</option>
                {featuredCategoryOptions.map(f => (
                  <option key={f.id} value={f.id}>{f.title}</option>
                ))}
              </select>
              <p className="text-[0.75rem] text-[#9CA3AF] mt-1.5">
                Shown on the homepage&apos;s &quot;Shop By Category&quot; only when at least one product carries it. Manage the list itself under Content → Featured Categories.
              </p>
            </Field>
            <div className="pt-1 border-t border-[#F3F4F6]">
              <Toggle checked={chargeTax} onChange={() => { setChargeTax(v => !v); dirty() }}
                label="Charge Tax" description="Apply tax to this product" />
            </div>
          </div>

          {/* Pricing */}
          <div className={SECTION + ' space-y-4'}>
            <SectionHeading>Pricing</SectionHeading>
            <Field label="Base Price (₹)" required>
              <input type="number" min="0" className={INPUT} value={basePrice}
                onChange={e => { setBasePrice(e.target.value); dirty() }} placeholder="2499" />
            </Field>
            <Field label="Sale Price (₹)">
              <input type="number" min="0" className={INPUT} value={salePrice}
                onChange={e => { setSalePrice(e.target.value); dirty() }} placeholder="Optional" />
            </Field>
            {discount && (
              <div className="text-[0.78rem] font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                {discount}% off — customers save ₹{(Number(basePrice) - Number(salePrice)).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Visibility / Labels */}
          <div className={SECTION}>
            <SectionHeading>Visibility</SectionHeading>
            <div className="flex flex-col gap-3">
              <Toggle checked={isFeatured} onChange={() => { setIsFeatured(v => !v); dirty() }} label="Featured Product"
                description="Shown in featured sections" />
              <Toggle checked={isBestSeller} onChange={() => { setIsBestSeller(v => !v); dirty() }} label="Best Seller"
                description="Shows 'Hot' badge on product" />
              <Toggle checked={isNewArrival} onChange={() => { setIsNewArrival(v => !v); dirty() }} label="New Arrival"
                description="Shows 'New' badge on product" />
            </div>
          </div>

          {/* Tags */}
          <div className={SECTION}>
            <SectionHeading>Tags</SectionHeading>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-[#F3F4F6] text-[#374151] text-[0.8rem] font-medium px-2.5 py-1 rounded-full">
                    {tag}
                    <button onClick={() => { setTags(prev => prev.filter(t => t !== tag)); dirty() }}
                      className="text-[#9CA3AF] hover:text-red-500 transition-colors ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              className={INPUT}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault()
                  const t = tagInput.trim().replace(/,$/, '')
                  if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); dirty() }
                  setTagInput('')
                }
              }}
              placeholder="Type tag + Enter (e.g. Girls, Festive, Silk)"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Girls', 'Boys', 'Festive', 'Casual', 'Silk', 'Cotton', 'New'].filter(t => !tags.includes(t)).map(t => (
                <button key={t} onClick={() => { setTags(prev => [...prev, t]); dirty() }}
                  className="text-[0.73rem] px-2 py-0.5 border border-[#E5E7EB] text-[#6B7280] rounded-full hover:bg-[#F3F4F6] transition-colors">
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Variant Generator ────────────────────────────────────────────────── */}
      <div className={SECTION + ' mb-5'}>
        <div className="flex items-center justify-between mb-4">
          <SectionHeading>Variants</SectionHeading>
          <span className="text-[0.78rem] text-[#9CA3AF]">
            {isEdit
              ? `${product?.variants?.filter(v => !v.deleted_at).length ?? 0} saved`
              : pendingVariants.length > 0 ? `${pendingVariants.length} pending` : '0 added'}
          </span>
        </div>

        {/* Saved variants table */}
        {isEdit && (product?.variants?.filter(v => !v.deleted_at).length ?? 0) > 0 && (
          <div className="overflow-x-auto mb-5 border border-[#F3F4F6] rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                  {['SKU', 'Size / Color', 'Price', 'Available Stock', 'Status', ''].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-[0.75rem] font-bold text-[#6B7280] uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9FAFB]">
                {product?.variants?.filter(v => !v.deleted_at).map(v => {
                  const currentStock = v.inventory?.stock_available ?? 0
                  const reserved = v.inventory?.stock_reserved ?? 0
                  const threshold = v.inventory?.low_stock_threshold ?? 5
                  const draftStock = stockEdits[v.id]
                  const isDirtyStock = draftStock !== undefined
                  const stockColor = currentStock === 0
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : currentStock <= threshold
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-green-700 bg-green-50 border-green-200'

                  return (
                    <tr key={v.id} className="hover:bg-[#FAFAF9] transition-colors group">
                      <td className="py-3 px-3">
                        <Link href={`/admin/products/${productId}/variants/${v.id}`}
                          className="font-mono text-[0.82rem] font-bold text-[#111827] bg-[#F3F4F6] px-2 py-1 rounded hover:bg-[#E5E7EB] transition-colors">
                          {v.sku}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[0.875rem] text-[#374151]">
                          {[v.size, v.color].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[0.875rem] font-semibold text-[#111827]">
                          {v.price_override ? `₹${v.price_override.toLocaleString('en-IN')}` : '—'}
                        </div>
                        {(v as any).compare_at_price && (
                          <div className="text-[0.75rem] text-[#9CA3AF] line-through">₹{(v as any).compare_at_price.toLocaleString('en-IN')}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number" min="0"
                            value={isDirtyStock ? draftStock : String(currentStock)}
                            onChange={e => setStockEdits(prev => ({ ...prev, [v.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveStock(v.id); if (e.key === 'Escape') setStockEdits(prev => { const n = { ...prev }; delete n[v.id]; return n }) }}
                            className={`w-20 bg-white border-[1.5px] rounded-lg px-2 py-1.5 text-[0.875rem] font-bold outline-none transition-all ${isDirtyStock ? 'border-[#C4654A] ring-2 ring-[#C4654A]/10 text-[#C4654A]' : `border-[#E5E7EB] ${currentStock === 0 ? 'text-red-600' : 'text-[#374151]'}`}`}
                          />
                          {isDirtyStock && (
                            <button onClick={() => handleSaveStock(v.id)} disabled={stockSaving[v.id]}
                              className="p-1.5 bg-[#C4654A] text-white rounded-lg hover:bg-[#A0523A] disabled:opacity-50 transition-colors" title="Save stock">
                              {stockSaving[v.id] ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin block" /> : <Check size={12} />}
                            </button>
                          )}
                          {!isDirtyStock && (
                            <span className={`text-[0.72rem] font-bold px-2 py-0.5 rounded-full border ${stockColor}`}>
                              {currentStock === 0 ? 'OOS' : currentStock <= threshold ? 'LOW' : 'OK'}
                            </span>
                          )}
                        </div>
                        {reserved > 0 && !isDirtyStock && (
                          <p className="text-[0.7rem] text-[#9CA3AF] mt-0.5">{reserved} reserved</p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[0.78rem] font-bold px-2.5 py-1 rounded-full ${v.is_active ? 'text-green-700 bg-green-50' : 'text-[#9CA3AF] bg-[#F3F4F6]'}`}>
                          {v.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/products/${productId}/variants/${v.id}`}
                            className="p-1.5 rounded-lg hover:bg-[#EFF6FF] text-[#6B7280] hover:text-blue-600 transition-colors" title="Edit variant">
                            <ChevronRight size={14} />
                          </Link>
                          <button onClick={() => handleDeleteVariant(v.id)} className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pending variants (create mode) */}
        {!isEdit && pendingVariants.length > 0 && (
          <div className="overflow-x-auto mb-4 border border-[#E5E7EB] rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                  {['SKU', 'Size', 'Color', 'Price Override', 'Stock', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[0.72rem] font-bold text-[#6B7280] uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9FAFB]">
                {pendingVariants.map(v => (
                  <tr key={v._key}>
                    <td className="py-2.5 px-3"><span className="font-mono text-[0.8rem] font-bold text-[#111827] bg-[#F3F4F6] px-2 py-0.5 rounded">{v.sku}</span></td>
                    <td className="py-2.5 px-3 text-[0.85rem]">{v.size || '—'}</td>
                    <td className="py-2.5 px-3 text-[0.85rem]">{v.color || '—'}</td>
                    <td className="py-2.5 px-3 text-[0.85rem]">{v.price_override ? `₹${Number(v.price_override).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min={0}
                        value={v.stock}
                        onChange={e => setPendingVariants(vs => vs.map(x => x._key === v._key ? { ...x, stock: e.target.value } : x))}
                        className="w-20 border border-[#D1D5DB] rounded-lg px-2 py-1 text-[0.85rem] font-bold text-[#111827] outline-none focus:border-[#C4654A] focus:ring-1 focus:ring-[#C4654A]/10"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => setPendingVariants(vs => vs.filter(x => x._key !== v._key))} className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Variant Generator — Shopify-style chip inputs */}
        <div className="border border-[#E5E7EB] rounded-xl p-4 mb-4 bg-[#FAFAFA]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.8rem] font-bold text-[#374151]">Variant Generator</p>
            {livePreview.length > 0 && (
              <span className="text-[0.75rem] text-[#6B7280] font-semibold">{livePreview.length} variant{livePreview.length !== 1 ? 's' : ''} will be generated</span>
            )}
          </div>

          <div className="space-y-4 mb-4">
            {variantOptions.map((opt) => (
              <div key={opt._key} className="bg-white border border-[#E5E7EB] rounded-xl p-3.5">
                {/* Option name row */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="flex-1">
                    <p className="text-[0.72rem] font-bold text-[#9CA3AF] uppercase tracking-[0.04em] mb-1">Option Name</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <input
                        className="border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-[0.85rem] text-[#111827] outline-none focus:border-[#C4654A] focus:ring-1 focus:ring-[#C4654A]/10 w-32"
                        placeholder="e.g. Size"
                        value={opt.name}
                        onChange={e => setVariantOptions(prev => prev.map(o => o._key === opt._key ? { ...o, name: e.target.value } : o))}
                      />
                      {OPTION_SUGGESTIONS.filter(s => !variantOptions.some(o => o.name === s) || opt.name === s).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setVariantOptions(prev => prev.map(o => o._key === opt._key ? { ...o, name: s } : o))}
                          className={`px-2.5 py-1 rounded-full text-[0.72rem] font-semibold border transition-colors ${opt.name === s ? 'bg-[#C4654A] border-[#C4654A] text-white' : 'bg-surface border-[#E5E7EB] text-[#6B7280] hover:border-[#C4654A] hover:text-[#C4654A]'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {variantOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVariantOptions(prev => prev.filter(o => o._key !== opt._key))}
                      className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start mt-5"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Values chips */}
                <p className="text-[0.72rem] font-bold text-[#9CA3AF] uppercase tracking-[0.04em] mb-1.5">Values</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {opt.vals.map((val, vi) => (
                    <span key={vi} className="inline-flex items-center gap-1 bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-[0.8rem] font-semibold px-2.5 py-1 rounded-full">
                      {val}
                      <button
                        type="button"
                        onClick={() => setVariantOptions(prev => prev.map(o => o._key === opt._key ? { ...o, vals: o.vals.filter((_, i) => i !== vi) } : o))}
                        className="text-[#9CA3AF] hover:text-red-500 ml-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    className="border border-dashed border-[#D1D5DB] rounded-full px-3 py-1 text-[0.8rem] text-[#374151] outline-none focus:border-[#C4654A] w-32 placeholder:text-[#C4B9B3]"
                    placeholder="Type + Enter"
                    value={opt.inputDraft}
                    onChange={e => setVariantOptions(prev => prev.map(o => o._key === opt._key ? { ...o, inputDraft: e.target.value } : o))}
                    onKeyDown={e => {
                      if ((e.key === 'Enter' || e.key === ',') && opt.inputDraft.trim()) {
                        e.preventDefault()
                        const newVal = opt.inputDraft.trim().replace(/,$/, '')
                        if (newVal && !opt.vals.includes(newVal)) {
                          setVariantOptions(prev => prev.map(o => o._key === opt._key ? { ...o, vals: [...o.vals, newVal], inputDraft: '' } : o))
                        }
                      }
                    }}
                    onBlur={() => {
                      if (opt.inputDraft.trim()) {
                        const newVal = opt.inputDraft.trim()
                        if (!opt.vals.includes(newVal)) {
                          setVariantOptions(prev => prev.map(o => o._key === opt._key ? { ...o, vals: [...o.vals, newVal], inputDraft: '' } : o))
                        } else {
                          setVariantOptions(prev => prev.map(o => o._key === opt._key ? { ...o, inputDraft: '' } : o))
                        }
                      }
                    }}
                  />
                </div>
                {opt.vals.length === 0 && (
                  <p className="text-[0.73rem] text-[#C4B9B3]">Type a value and press Enter to add it as a chip (e.g. 0-6M, 6-12M, 1-2Y…)</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVariantOptions(prev => [...prev, { _key: String(Date.now()), name: '', vals: [], inputDraft: '' }])}
              className="flex items-center gap-1 text-[0.8rem] text-[#6B7280] hover:text-[#374151] font-semibold transition-colors"
            >
              <Plus size={13} /> Add Option
            </button>
            {livePreview.length > 0 && (
              <button
                type="button"
                onClick={confirmGeneratedVariants}
                disabled={addingVariant}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#C4654A] text-white text-[0.82rem] font-bold rounded-xl hover:bg-[#A0523A] transition-colors disabled:opacity-60 ml-auto"
              >
                <Plus size={13} /> {addingVariant ? 'Adding…' : `Add ${livePreview.length} Variant${livePreview.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {/* Live preview */}
          {livePreview.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              <p className="text-[0.72rem] font-bold text-[#9CA3AF] uppercase tracking-[0.04em] mb-2">Preview</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {livePreview.slice(0, 20).map((v, i) => (
                  <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[0.75rem]">
                    <p className="font-mono font-semibold text-[#111827] truncate">{v.sku}</p>
                    <p className="text-[#9CA3AF] truncate">{[v.size, v.color].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                ))}
                {livePreview.length > 20 && (
                  <div className="bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[0.75rem] flex items-center justify-center text-[#9CA3AF]">
                    +{livePreview.length - 20} more
                  </div>
                )}
              </div>
            </div>
          )}

          {livePreview.length === 0 && variantOptions.every(o => o.vals.length === 0) && (
            <p className="text-[0.78rem] text-[#C4B9B3] mt-2">Add at least one option with values to generate variants automatically.</p>
          )}
        </div>

        {/* Manual single variant add row */}
        <div className="pt-1 border-t border-[#F3F4F6]">
          <p className="text-[0.75rem] font-bold text-[#9CA3AF] uppercase tracking-[0.06em] mb-2.5 mt-3">Add Single Variant</p>
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
            <Field label="Available Stock">
              <input type="number" min={0} className={INPUT} placeholder="0" value={newVariant.stock}
                onChange={e => setNewVariant(v => ({ ...v, stock: e.target.value }))} />
            </Field>
          </div>
          <button onClick={handleAddVariantRow} disabled={!newVariant.sku || addingVariant}
            className="flex items-center gap-1.5 text-[0.82rem] font-bold text-[#C4654A] hover:text-[#A0523A] disabled:opacity-40 transition-colors">
            <Plus size={14} /> {addingVariant ? 'Adding…' : 'Add Variant'}
          </button>
        </div>
      </div>

      {/* ─── Images ──────────────────────────────────────────────────────────── */}
      <div className={SECTION + ' mb-5'}>
        <div className="flex items-center justify-between mb-4">
          <SectionHeading>Images</SectionHeading>
          <span className="text-[0.78rem] text-[#9CA3AF]">
            {savedImages.length + pendingUploads.length} image{savedImages.length + pendingUploads.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ImageUploader
          productId={productId}
          images={savedImages}
          pending={pendingUploads}
          onSavedImagesChange={setSavedImages}
          onPendingChange={setPendingUploads}
        />
      </div>

      {/* ─── Bottom bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4">
        <Link href="/admin/products" className="text-[0.875rem] font-semibold text-[#6B7280] hover:text-[#374151] transition-colors">
          ← Back to Products
        </Link>
        <div className="flex items-center gap-2">
          {isEdit && slug && (
            <a href={`/product/${slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#374151] text-[0.875rem] font-semibold hover:bg-[#F9FAFB] transition-colors">
              <ExternalLink size={14} /> Preview
            </a>
          )}
          <SaveBtn />
        </div>
      </div>

    </div>
  )
}
