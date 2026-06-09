'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Check, Package } from 'lucide-react'
import { adminGetVariant, adminUpdateVariantFull } from '@/lib/api/admin/products'
import { toast } from 'sonner'

const INPUT = "w-full bg-white border-[1.5px] border-[#D1D5DB] rounded-xl px-4 py-3 text-[0.9rem] text-[#111827] outline-none focus:border-[#C4654A] focus:ring-2 focus:ring-[#C4654A]/10 transition-all placeholder:text-[#9CA3AF]"
const SECTION = "bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[0.875rem] font-semibold text-[#374151]">{label}</label>
      {children}
      {hint && <p className="text-[0.75rem] text-[#9CA3AF]">{hint}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: () => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-[0.9rem] font-medium text-[#374151]">{label}</p>
        {description && <p className="text-[0.75rem] text-[#9CA3AF]">{description}</p>}
      </div>
      <button type="button" onClick={onChange}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#C4654A]/30 ${checked ? 'bg-[#C4654A]' : 'bg-[#D1D5DB]'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function StockBar({ available, reserved }: { available: number; reserved: number }) {
  const total = available + reserved
  const pct = total > 0 ? Math.round((available / total) * 100) : 0
  const color = available === 0 ? 'bg-red-500' : available <= 3 ? 'bg-amber-400' : 'bg-green-500'
  return (
    <div>
      <div className="flex justify-between text-[0.78rem] font-semibold mb-1.5">
        <span className={available === 0 ? 'text-red-600' : available <= 3 ? 'text-amber-600' : 'text-green-700'}>
          {available} available
        </span>
        {reserved > 0 && <span className="text-[#9CA3AF]">{reserved} reserved</span>}
      </div>
      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.max(pct, available > 0 ? 4 : 0)}%` }} />
      </div>
      <p className="text-[0.73rem] text-[#9CA3AF] mt-1">{total} total units</p>
    </div>
  )
}

interface Props { productId: string; variantId: string }

export function VariantEditForm({ productId, variantId }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [variant, setVariant] = useState<any>(null)

  // Variant fields
  const [sku, setSku] = useState('')
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [barcode, setBarcode] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Pricing
  const [price, setPrice] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [costPerItem, setCostPerItem] = useState('')

  // Inventory settings
  const [stock, setStock] = useState('')
  const [lowThreshold, setLowThreshold] = useState('')
  const [inventoryTracked, setInventoryTracked] = useState(true)
  const [sellWhenOos, setSellWhenOos] = useState(false)

  useEffect(() => {
    adminGetVariant(productId, variantId)
      .then(v => {
        setVariant(v)
        setSku(v.sku ?? '')
        setSize(v.size ?? '')
        setColor(v.color ?? '')
        setBarcode(v.barcode ?? '')
        setIsActive(v.is_active ?? true)
        setPrice(v.price_override != null ? String(v.price_override) : '')
        setCompareAt(v.compare_at_price != null ? String(v.compare_at_price) : '')
        setCostPerItem(v.cost_per_item != null ? String(v.cost_per_item) : '')
        setStock(String(v.inventory?.stock_available ?? 0))
        setLowThreshold(String(v.inventory?.low_stock_threshold ?? 5))
        setInventoryTracked(v.inventory?.inventory_tracked ?? true)
        setSellWhenOos(v.inventory?.sell_when_out_of_stock ?? false)
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [productId, variantId])

  const handleSave = async () => {
    if (!sku.trim()) { toast.error('SKU is required'); return }
    setSaving(true)
    try {
      await adminUpdateVariantFull(productId, variantId, {
        sku: sku.trim(),
        size: size || undefined,
        color: color || undefined,
        barcode: barcode || null,
        is_active: isActive,
        price_override: price ? Number(price) : null,
        compare_at_price: compareAt ? Number(compareAt) : null,
        cost_per_item: costPerItem ? Number(costPerItem) : null,
        inventory_tracked: inventoryTracked,
        sell_when_out_of_stock: sellWhenOos,
        low_stock_threshold: lowThreshold ? Number(lowThreshold) : 5,
        new_stock: Number(stock),
        reason: 'adjustment',
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast.success('Variant saved')
      // Refresh
      const updated = await adminGetVariant(productId, variantId)
      setVariant(updated)
      setStock(String(updated.inventory?.stock_available ?? 0))
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-[#F3F4F6] rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  const stockNum = Number(stock)
  const priceNum = Number(price)
  const costNum = Number(costPerItem)
  const profit = price && costPerItem ? priceNum - costNum : null
  const margin = profit !== null && priceNum > 0 ? Math.round((profit / priceNum) * 100) : null
  const compareNum = Number(compareAt)
  const discount = compareAt && price && compareNum > priceNum
    ? Math.round(((compareNum - priceNum) / compareNum) * 100) : null

  const variantLabel = [size, color].filter(Boolean).join(' / ') || sku || 'Variant'

  return (
    <div className="max-w-2xl mx-auto pb-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/admin/products/${productId}/edit`}
            className="p-2 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] shadow-sm transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-[0.75rem] text-[#9CA3AF] font-medium">Variant</p>
            <h1 className="font-body text-[1.25rem] font-bold text-[#111827] tracking-tight">{variantLabel}</h1>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] transition-all shadow-sm disabled:opacity-60 hover:-translate-y-0.5">
          {saved ? <><Check size={14} /> Saved</> : saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save size={14} /> Save Variant</>}
        </button>
      </div>

      {/* Stock Summary Card */}
      <div className={SECTION + ' mb-5'}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[#FFF7F5] rounded-xl">
            <Package size={18} className="text-[#C4654A]" />
          </div>
          <div>
            <p className="text-[0.8rem] font-bold text-[#6B7280] uppercase tracking-[0.06em]">Inventory Overview</p>
            <p className="text-[0.85rem] text-[#374151]">SKU: <span className="font-mono font-bold">{sku}</span></p>
          </div>
        </div>
        <StockBar available={variant?.inventory?.stock_available ?? 0} reserved={variant?.inventory?.stock_reserved ?? 0} />
      </div>

      {/* Options */}
      <div className={SECTION + ' mb-5 space-y-4'}>
        <h2 className="text-[0.85rem] font-bold text-[#6B7280] uppercase tracking-[0.06em]">Options</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Size">
            <input className={INPUT} value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. 2-3 Yrs" />
          </Field>
          <Field label="Color">
            <input className={INPUT} value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Gold" />
          </Field>
        </div>
        <Toggle checked={isActive} onChange={() => setIsActive(v => !v)} label="Active" description="Inactive variants cannot be added to cart" />
      </div>

      {/* Pricing */}
      <div className={SECTION + ' mb-5 space-y-4'}>
        <h2 className="text-[0.85rem] font-bold text-[#6B7280] uppercase tracking-[0.06em]">Pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (₹)" hint="Overrides product base price">
            <input type="number" min="0" className={INPUT} value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 2090" />
          </Field>
          <Field label="Compare-at Price (₹)" hint="Shows as strikethrough">
            <input type="number" min="0" className={INPUT} value={compareAt} onChange={e => setCompareAt(e.target.value)} placeholder="e.g. 2320" />
          </Field>
        </div>
        {discount && (
          <div className="text-[0.8rem] font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2">
            {discount}% off — customer saves ₹{(compareNum - priceNum).toLocaleString('en-IN')}
          </div>
        )}
        <Field label="Cost Per Item (₹)" hint="Not shown to customers. Used to calculate profit.">
          <input type="number" min="0" className={INPUT} value={costPerItem} onChange={e => setCostPerItem(e.target.value)} placeholder="e.g. 1455" />
        </Field>
        {profit !== null && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3">
              <p className="text-[0.73rem] text-[#9CA3AF] font-semibold uppercase tracking-[0.06em]">Profit</p>
              <p className={`text-[1rem] font-bold mt-0.5 ${profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                ₹{profit.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3">
              <p className="text-[0.73rem] text-[#9CA3AF] font-semibold uppercase tracking-[0.06em]">Margin</p>
              <p className={`text-[1rem] font-bold mt-0.5 ${(margin ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {margin}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Inventory */}
      <div className={SECTION + ' mb-5 space-y-5'}>
        <h2 className="text-[0.85rem] font-bold text-[#6B7280] uppercase tracking-[0.06em]">Inventory</h2>

        <Toggle checked={inventoryTracked} onChange={() => setInventoryTracked(v => !v)} label="Track inventory"
          description="Track how many units are available" />

        {inventoryTracked && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Available Quantity" hint="Change triggers an audit log entry">
                <input type="number" min="0" className={INPUT} value={stock} onChange={e => setStock(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Low Stock Threshold" hint="Alert when stock falls below this">
                <input type="number" min="0" className={INPUT} value={lowThreshold} onChange={e => setLowThreshold(e.target.value)} placeholder="5" />
              </Field>
            </div>
            {variant?.inventory && (
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Available', value: variant.inventory.stock_available, color: variant.inventory.stock_available === 0 ? 'text-red-600' : 'text-green-700' },
                  { label: 'Reserved', value: variant.inventory.stock_reserved, color: 'text-amber-600' },
                  { label: 'Total', value: variant.inventory.stock_available + variant.inventory.stock_reserved, color: 'text-[#374151]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl py-3">
                    <p className="text-[0.72rem] text-[#9CA3AF] font-semibold uppercase tracking-[0.06em]">{label}</p>
                    <p className={`text-[1.2rem] font-bold mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <Toggle checked={sellWhenOos} onChange={() => setSellWhenOos(v => !v)} label="Sell when out of stock"
          description="Continue accepting orders even if stock reaches 0" />
      </div>

      {/* SKU & Barcode */}
      <div className={SECTION + ' mb-5 space-y-4'}>
        <h2 className="text-[0.85rem] font-bold text-[#6B7280] uppercase tracking-[0.06em]">SKU & Barcode</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SKU *" hint="Must be unique across all products">
            <input className={INPUT} value={sku} onChange={e => setSku(e.target.value)} placeholder="PATTU-GLD-2Y" />
          </Field>
          <Field label="Barcode" hint="ISBN, UPC, GTIN, etc.">
            <input className={INPUT} value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Optional" />
          </Field>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4">
        <Link href={`/admin/products/${productId}/edit`} className="text-[0.875rem] font-semibold text-[#6B7280] hover:text-[#374151] transition-colors">
          ← Back to Product
        </Link>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] transition-all shadow-sm disabled:opacity-60">
          {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving…' : <><Save size={14} /> Save Variant</>}
        </button>
      </div>
    </div>
  )
}
