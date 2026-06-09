'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Trash2, Plus, ChevronUp, ChevronDown, Eye } from 'lucide-react'
import type { HomepageSection } from '@/types/homepage'
import { CmsImageUpload } from '@/components/admin/CmsImageUpload'

const INPUT = 'w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all'
const LABEL = 'block text-[0.78rem] font-semibold text-[#78716C] mb-1.5'

const EMPTY: Omit<HomepageSection, 'id' | 'created_at' | 'updated_at'> = {
  section_type: 'promo_block',
  title: '',
  subtitle: '',
  body_text: '',
  image_url: '',
  link_url: '',
  link_text: 'Explore',
  badge_text: null,
  sort_order: 0,
  is_active: true,
  metadata: {},
}

function BlockCard({
  block,
  index,
  total,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  block: HomepageSection
  index: number
  total: number
  onSave: (id: string, data: Partial<HomepageSection>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}) {
  const [form, setForm] = useState({
    title: block.title ?? '',
    subtitle: block.subtitle ?? '',
    body_text: block.body_text ?? '',
    image_url: block.image_url ?? '',
    link_url: block.link_url ?? '',
    link_text: block.link_text ?? 'Explore',
    is_active: block.is_active,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(block.id, form).finally(() => setSaving(false))
  }

  const handleDelete = async () => {
    if (!confirm('Delete this promo block? This cannot be undone.')) return
    setDeleting(true)
    await onDelete(block.id).finally(() => setDeleting(false))
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
            onClick={e => { e.stopPropagation(); onMoveUp(block.id) }}
            className="disabled:opacity-30 p-0.5 hover:bg-[#F0EDE9] rounded transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={e => { e.stopPropagation(); onMoveDown(block.id) }}
            className="disabled:opacity-30 p-0.5 hover:bg-[#F0EDE9] rounded transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {form.image_url && (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[0.875rem] text-[#1C1917] truncate">{form.title || 'Untitled Block'}</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Headline *</label>
              <input className={INPUT} value={form.title} onChange={set('title')} placeholder="Pattupavadai Collection" />
            </div>
            <div>
              <label className={LABEL}>Tagline</label>
              <input className={INPUT} value={form.subtitle} onChange={set('subtitle')} placeholder="Handcrafted designs in premium silk" />
            </div>
          </div>

          <div>
            <label className={LABEL}>Category Badge (top-left text)</label>
            <input className={INPUT} value={form.body_text} onChange={set('body_text')} placeholder="Girls · 0–7 Years" />
          </div>

          <CmsImageUpload
            value={form.image_url}
            onChange={url => setForm(f => ({ ...f, image_url: url }))}
            folder="promo-blocks"
            label="Block Image"
            aspectHint="Recommended: 800 × 500 px (landscape)"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>CTA Text</label>
              <input className={INPUT} value={form.link_text} onChange={set('link_text')} placeholder="Explore" />
            </div>
            <div>
              <label className={LABEL}>CTA Link</label>
              <input className={INPUT} value={form.link_url} onChange={set('link_url')} placeholder="/shop/girls-traditional" />
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

export default function PromoBlocksAdminPage() {
  const [blocks, setBlocks] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/content/sections', { credentials: 'include' })
      .then(r => r.json())
      .then(j => setBlocks(
        (j.data as HomepageSection[])?.filter(s => s.section_type === 'promo_block').sort((a, b) => a.sort_order - b.sort_order) ?? []
      ))
      .catch(() => toast.error('Failed to load promo blocks'))
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
    setBlocks(bs => bs.map(b => b.id === id ? json.data : b))
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/content/sections/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Deleted')
    setBlocks(bs => bs.filter(b => b.id !== id))
  }

  const handleAdd = async () => {
    setAdding(true)
    const res = await fetch('/api/admin/content/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...EMPTY, sort_order: blocks.length }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Failed to add'); setAdding(false); return }
    setBlocks(bs => [...bs, json.data])
    setAdding(false)
  }

  const reorder = async (newOrder: HomepageSection[]) => {
    setBlocks(newOrder)
    await fetch('/api/admin/content/sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: newOrder.map(b => b.id) }),
    }).catch(() => toast.error('Failed to save order'))
  }

  const moveUp = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx <= 0) return
    const next = [...blocks]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    reorder(next)
  }

  const moveDown = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx >= blocks.length - 1) return
    const next = [...blocks]
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
          <h1 className="font-body text-[1.35rem] font-bold text-[#1C1917] tracking-tight">Promo Blocks</h1>
          <p className="text-[0.82rem] text-[#78716C] mt-0.5">The two editorial image cards shown below Best Sellers</p>
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
            <Plus size={15} /> {adding ? 'Adding…' : 'Add Block'}
          </button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-16 text-[0.875rem] text-[#78716C]">
          No promo blocks yet. Add one above.
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <BlockCard
              key={block.id}
              block={block}
              index={i}
              total={blocks.length}
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
