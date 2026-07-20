'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Trash2, Plus, ChevronUp, ChevronDown, Eye, Move } from 'lucide-react'
import type { HomepageSection } from '@/types/homepage'
import { CmsImageUpload } from '@/components/admin/CmsImageUpload'
import { BannerPreviewPanel } from '@/components/admin/BannerPreviewPanel'

const INPUT = 'w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all'
const LABEL = 'block text-[0.78rem] font-semibold text-[#78716C] mb-1.5'

// 3x3 focal-point grid — same 9 keys as HeroBanner's OBJECT_POSITION_CLASS, so whatever
// gets picked here is exactly what the live storefront crop will honor.
const POSITION_GRID: { key: string; label: string }[] = [
  { key: 'left-top', label: 'Top left' },
  { key: 'top', label: 'Top' },
  { key: 'right-top', label: 'Top right' },
  { key: 'left', label: 'Left' },
  { key: 'center', label: 'Center' },
  { key: 'right', label: 'Right' },
  { key: 'left-bottom', label: 'Bottom left' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'right-bottom', label: 'Bottom right' },
]

function PositionPicker({ value, onChange }: { value: string; onChange: (pos: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid grid-cols-3 gap-1 w-[72px] shrink-0">
        {POSITION_GRID.map(p => (
          <button
            key={p.key}
            type="button"
            title={p.label}
            onClick={() => onChange(p.key)}
            className={`w-6 h-6 rounded-md border transition-colors ${
              (value || 'center') === p.key
                ? 'bg-[#C4654A] border-[#C4654A]'
                : 'bg-white border-[#E7E5E4] hover:border-[#C4654A]'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[0.72rem] text-[#78716C]">
        <Move size={12} /> Focal point — which part of the image stays visible when cropped
      </div>
    </div>
  )
}

const EMPTY: Omit<HomepageSection, 'id' | 'created_at' | 'updated_at'> = {
  section_type: 'banner',
  title: '',
  subtitle: '',
  body_text: '',
  image_url: '',
  link_url: '/shop/new',
  link_text: 'Shop Now',
  badge_text: '',
  sort_order: 0,
  is_active: true,
  metadata: {},
}

function BannerCard({
  banner,
  index,
  total,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  banner: HomepageSection
  index: number
  total: number
  onSave: (id: string, data: Partial<HomepageSection>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}) {
  const [form, setForm] = useState({
    title: banner.title ?? '',
    subtitle: banner.subtitle ?? '',
    badge_text: banner.badge_text ?? '',
    image_url: banner.image_url ?? '',
    link_url: banner.link_url ?? '/shop/new',
    link_text: banner.link_text ?? 'Shop Now',
    is_active: banner.is_active,
    metadata: (banner.metadata as Record<string, unknown>) ?? {},
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const setMeta = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, metadata: { ...f.metadata, [key]: e.target.value } }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(banner.id, form).finally(() => setSaving(false))
  }

  const handleDelete = async () => {
    if (!confirm('Delete this banner slide? This cannot be undone.')) return
    setDeleting(true)
    await onDelete(banner.id).finally(() => setDeleting(false))
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#FAFAF9] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex flex-col gap-0.5 mr-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={e => { e.stopPropagation(); onMoveUp(banner.id) }}
            className="disabled:opacity-30 p-0.5 hover:bg-[#F0EDE9] rounded transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={e => { e.stopPropagation(); onMoveDown(banner.id) }}
            className="disabled:opacity-30 p-0.5 hover:bg-[#F0EDE9] rounded transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {form.image_url && (
          <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[0.875rem] text-[#1C1917] truncate">{form.title || 'Untitled Slide'}</p>
          <p className="text-[0.78rem] text-[#78716C] truncate">{form.subtitle || form.link_url || '—'}</p>
        </div>

        <span className={`shrink-0 text-[0.72rem] font-bold px-2.5 py-0.5 rounded-full ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-[#F5F5F4] text-[#78716C]'}`}>
          {form.is_active ? 'Active' : 'Hidden'}
        </span>
        <ChevronDown size={16} className={`text-[#A8A29E] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="border-t border-[#E7E5E4] p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${form.is_active ? 'bg-[#C4654A]' : 'bg-[#D6D3D1]'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <label className="text-[0.875rem] font-semibold text-[#1C1917]">
              {form.is_active ? 'Active' : 'Hidden'}
            </label>
          </div>

          <div>
            <label className={LABEL}>Badge Text</label>
            <input className={INPUT} value={form.badge_text} onChange={set('badge_text')} placeholder="New Collection 2026" />
          </div>
          <div>
            <label className={LABEL}>Headline *</label>
            <input className={INPUT} value={form.title} onChange={set('title')} placeholder="Comfort in Every Stitch." />
          </div>
          <div>
            <label className={LABEL}>Subheading</label>
            <textarea className={`${INPUT} resize-none`} rows={2} value={form.subtitle} onChange={set('subtitle')} placeholder="Timeless ethnic wear crafted for your little ones…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Primary CTA Text</label>
              <input className={INPUT} value={form.link_text} onChange={set('link_text')} placeholder="Shop Now" />
            </div>
            <div>
              <label className={LABEL}>Primary CTA Link</label>
              <input className={INPUT} value={form.link_url} onChange={set('link_url')} placeholder="/shop/new" />
            </div>
          </div>

          <div className="border-t border-[#E7E5E4] pt-4 space-y-3">
            <CmsImageUpload
              value={form.image_url}
              onChange={url => setForm(f => ({ ...f, image_url: url }))}
              folder="banner"
              label="Desktop / Laptop Image"
              aspectHint="Recommended: 1920 × 640 px (landscape, ~3:1)"
            />
            {form.image_url && (
              <PositionPicker
                value={String(form.metadata.desktop_image_position ?? 'center')}
                onChange={pos => setForm(f => ({ ...f, metadata: { ...f.metadata, desktop_image_position: pos } }))}
              />
            )}
          </div>

          <div className="border-t border-[#E7E5E4] pt-4 space-y-3">
            <CmsImageUpload
              value={String(form.metadata.mobile_image_url ?? '')}
              onChange={url => setForm(f => ({ ...f, metadata: { ...f.metadata, mobile_image_url: url } }))}
              folder="banner"
              label="Mobile Image (optional)"
              aspectHint="Recommended: 1080 × 1350 px (portrait, ~4:5)"
            />
            <p className="text-[0.72rem] text-[#A8A29E]">
              Shown only on phones — the desktop/laptop image is used on phones too if this is left empty.
            </p>
            {Boolean(form.metadata.mobile_image_url) && (
              <PositionPicker
                value={String(form.metadata.mobile_image_position ?? 'center')}
                onChange={pos => setForm(f => ({ ...f, metadata: { ...f.metadata, mobile_image_position: pos } }))}
              />
            )}
          </div>

          {Boolean(form.image_url || form.metadata.mobile_image_url) && (
            <div className="border-t border-[#E7E5E4] pt-4">
              <p className={LABEL}>Live Preview</p>
              <BannerPreviewPanel
                title={form.title}
                badgeText={form.badge_text}
                desktopImageUrl={form.image_url}
                mobileImageUrl={String(form.metadata.mobile_image_url ?? '')}
                desktopPosition={String(form.metadata.desktop_image_position ?? 'center')}
                mobilePosition={String(form.metadata.mobile_image_position ?? 'center')}
              />
            </div>
          )}

          <div className="border-t border-[#E7E5E4] pt-4">
            <p className="text-[0.78rem] font-semibold text-[#78716C] mb-3">Secondary Button &amp; Offer Badge</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Secondary CTA Text</label>
                <input className={INPUT} value={String(form.metadata.secondary_link_text ?? '')} onChange={setMeta('secondary_link_text')} placeholder="View Collections" />
              </div>
              <div>
                <label className={LABEL}>Secondary CTA Link</label>
                <input className={INPUT} value={String(form.metadata.secondary_link_url ?? '')} onChange={setMeta('secondary_link_url')} placeholder="/collections" />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL}>Offer Badge Text</label>
              <input className={INPUT} value={String(form.metadata.offer_text ?? '')} onChange={setMeta('offer_text')} placeholder="₹300 OFF on orders above ₹2500" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-[0.82rem] font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#C4654A] text-white rounded-xl text-[0.875rem] font-bold hover:bg-[#A0523A] disabled:opacity-50 transition-colors"
            >
              <Save size={15} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BannerAdminPage() {
  const [banners, setBanners] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/content/sections', { credentials: 'include' })
      .then(r => r.json())
      .then(j => setBanners(
        (j.data as HomepageSection[])?.filter(s => s.section_type === 'banner').sort((a, b) => a.sort_order - b.sort_order) ?? []
      ))
      .catch(() => toast.error('Failed to load banners'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSave = async (id: string, data: Partial<HomepageSection>) => {
    const res = await fetch(`/api/admin/content/sections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Failed to save'); return }
    toast.success('Saved')
    setBanners(bs => bs.map(b => b.id === id ? json.data : b))
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/content/sections/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Deleted')
    setBanners(bs => bs.filter(b => b.id !== id))
  }

  const handleAdd = async () => {
    setAdding(true)
    const res = await fetch('/api/admin/content/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...EMPTY, sort_order: banners.length }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Failed to add'); setAdding(false); return }
    setBanners(bs => [...bs, json.data])
    setAdding(false)
  }

  const reorder = async (newOrder: HomepageSection[]) => {
    setBanners(newOrder)
    await fetch('/api/admin/content/sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: newOrder.map(b => b.id) }),
    }).catch(() => toast.error('Failed to save order'))
  }

  const moveUp = (id: string) => {
    const idx = banners.findIndex(b => b.id === id)
    if (idx <= 0) return
    const next = [...banners]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    reorder(next)
  }

  const moveDown = (id: string) => {
    const idx = banners.findIndex(b => b.id === id)
    if (idx >= banners.length - 1) return
    const next = [...banners]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    reorder(next)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[1, 2].map(i => <div key={i} className="h-20 bg-[#F5F5F4] rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-body text-[1.35rem] font-bold text-[#1C1917] tracking-tight">Homepage Banner</h1>
          <p className="text-[0.82rem] text-[#78716C] mt-0.5">The rotating hero carousel shown at the top of the homepage — add multiple slides to enable auto-rotation</p>
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank" className="flex items-center gap-1.5 px-3 py-2 border border-[#E7E5E4] rounded-xl text-[0.82rem] font-semibold text-[#78716C] hover:bg-[#F5F5F4] transition-colors">
            <Eye size={14} /> Preview
          </a>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2 bg-[#C4654A] text-white rounded-xl text-[0.875rem] font-bold hover:bg-[#A0523A] disabled:opacity-50 transition-colors"
          >
            <Plus size={15} /> {adding ? 'Adding…' : 'Add Slide'}
          </button>
        </div>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-16 text-[0.875rem] text-[#78716C]">
          No banner slides yet. Add one above.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, i) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              index={i}
              total={banners.length}
              onSave={handleSave}
              onDelete={handleDelete}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
            />
          ))}
        </div>
      )}
    </div>
  )
}
