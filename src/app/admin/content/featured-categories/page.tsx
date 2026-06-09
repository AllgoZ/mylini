'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Trash2, Plus, ChevronUp, ChevronDown, ChevronDown as ExpandIcon, Eye } from 'lucide-react'
import type { HomepageSection } from '@/types/homepage'
import { CmsImageUpload } from '@/components/admin/CmsImageUpload'

const INPUT = 'w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all'
const LABEL = 'block text-[0.78rem] font-semibold text-[#78716C] mb-1.5'
const SELECT = `${INPUT} cursor-pointer appearance-none bg-[image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716C' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_14px_center] pr-10`

type CatOption = { label: string; value: string }

const EMPTY: Omit<HomepageSection, 'id' | 'created_at' | 'updated_at'> = {
  section_type: 'featured_category',
  title: '',
  subtitle: null,
  body_text: null,
  image_url: '',
  link_url: '',
  link_text: null,
  badge_text: null,
  sort_order: 0,
  is_active: true,
  metadata: {},
}

function CategoryCard({
  section,
  index,
  total,
  catOptions,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  section: HomepageSection
  index: number
  total: number
  catOptions: CatOption[]
  onSave: (id: string, data: Partial<HomepageSection>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}) {
  const [form, setForm] = useState({
    title: section.title ?? '',
    image_url: section.image_url ?? '',
    link_url: section.link_url ?? '',
    is_active: section.is_active,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Display name is required'); return }
    if (!form.link_url) { toast.error('Please select a category'); return }
    setSaving(true)
    await onSave(section.id, form).finally(() => setSaving(false))
  }

  const handleDelete = async () => {
    if (!confirm('Remove this category? This cannot be undone.')) return
    setDeleting(true)
    await onDelete(section.id).finally(() => setDeleting(false))
  }

  const selectedLabel = catOptions.find(o => o.value === form.link_url)?.label ?? form.link_url

  return (
    <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
      {/* Collapsed header — always visible */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#FAFAF9] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(section.id)}
            className="disabled:opacity-30 p-0.5 hover:bg-[#F0EDE9] rounded transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMoveDown(section.id)}
            className="disabled:opacity-30 p-0.5 hover:bg-[#F0EDE9] rounded transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Pill thumbnail */}
        <div className="relative w-10 h-12 rounded-t-full rounded-b-xl overflow-hidden shrink-0 bg-[#F5F5F4]">
          {form.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">🏵️</div>
          )}
        </div>

        {/* Name + link */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[0.875rem] text-[#1C1917] truncate">
            {form.title || 'Untitled Category'}
          </p>
          <p className="text-[0.75rem] text-[#78716C] truncate mt-0.5">
            {selectedLabel || <span className="italic text-[#A8A29E]">No category selected</span>}
          </p>
        </div>

        <span className={`shrink-0 text-[0.72rem] font-bold px-2.5 py-0.5 rounded-full ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-[#F5F5F4] text-[#78716C]'}`}>
          {form.is_active ? 'Active' : 'Hidden'}
        </span>
        <ExpandIcon size={16} className={`text-[#A8A29E] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Expanded editing area */}
      {open && (
        <div className="border-t border-[#E7E5E4] p-5 space-y-5">
          {/* Image upload — full width, portrait crop hint */}
          <CmsImageUpload
            value={form.image_url}
            onChange={url => setForm(f => ({ ...f, image_url: url }))}
            folder="categories"
            label="Category Image"
            aspectHint="200 × 240 px · portrait 3:4 · pill shape"
          />

          {/* Name + category picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Display Name *</label>
              <input
                className={INPUT}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Girls Traditional"
              />
            </div>
            <div>
              <label className={LABEL}>Category *</label>
              {catOptions.length > 0 ? (
                <select
                  className={SELECT}
                  value={form.link_url}
                  onChange={e => {
                    const opt = catOptions.find(o => o.value === e.target.value)
                    setForm(f => ({
                      ...f,
                      link_url: e.target.value,
                      title: f.title || (opt?.label ?? ''),
                    }))
                  }}
                >
                  <option value="">— Select a category —</option>
                  {catOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input className={INPUT} value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="/shop/girls-traditional" />
              )}
            </div>
          </div>

          {/* Active toggle */}
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
            <span className="text-[0.875rem] font-semibold text-[#1C1917]">
              {form.is_active ? 'Visible on homepage' : 'Hidden'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-[0.82rem] font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} /> {deleting ? 'Removing…' : 'Remove'}
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

export default function FeaturedCategoriesAdminPage() {
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [catOptions, setCatOptions] = useState<CatOption[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content/sections', { credentials: 'include' })
        .then(r => r.json())
        .then(j => setSections(
          (j.data as HomepageSection[])?.filter(s => s.section_type === 'featured_category').sort((a, b) => a.sort_order - b.sort_order) ?? []
        )),
      fetch('/api/categories')
        .then(r => r.json())
        .then(j => {
          type CatTree = { id: string; name: string; slug: string; children?: CatTree[]; parent_id?: string | null }
          const tree: CatTree[] = j.data ?? []
          const opts: CatOption[] = []
          for (const parent of tree) {
            if (parent.children?.length) {
              for (const child of parent.children) {
                opts.push({ label: `${parent.name} › ${child.name}`, value: `/shop/${child.slug}` })
              }
            } else {
              opts.push({ label: parent.name, value: `/shop/${parent.slug}` })
            }
          }
          setCatOptions(opts)
        }),
    ])
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

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
    setSections(ss => ss.map(s => s.id === id ? json.data : s))
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/content/sections/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Removed')
    setSections(ss => ss.filter(s => s.id !== id))
  }

  const handleAdd = async () => {
    if (catOptions.length === 0) { toast.error('No categories found'); return }
    setAdding(true)
    const res = await fetch('/api/admin/content/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...EMPTY, sort_order: sections.length }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Failed to add'); setAdding(false); return }
    setSections(ss => [...ss, json.data])
    setAdding(false)
  }

  const reorder = async (newOrder: HomepageSection[]) => {
    setSections(newOrder)
    await fetch('/api/admin/content/sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: newOrder.map(s => s.id) }),
    }).catch(() => toast.error('Failed to save order'))
  }

  const moveUp = (id: string) => {
    const idx = sections.findIndex(s => s.id === id)
    if (idx <= 0) return
    const next = [...sections]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    reorder(next)
  }

  const moveDown = (id: string) => {
    const idx = sections.findIndex(s => s.id === id)
    if (idx >= sections.length - 1) return
    const next = [...sections]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    reorder(next)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-[72px] bg-[#F5F5F4] rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-body text-[1.35rem] font-bold text-[#1C1917] tracking-tight">Featured Categories</h1>
          <p className="text-[0.82rem] text-[#78716C] mt-0.5">
            {sections.length === 0
              ? 'No overrides — showing all categories automatically'
              : `${sections.length} ${sections.length === 1 ? 'category' : 'categories'} · overrides auto-list`}
          </p>
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
            <Plus size={15} /> {adding ? 'Adding…' : 'Add Category'}
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="bg-[#FAFAF9] border border-dashed border-[#E7E5E4] rounded-2xl text-center py-12">
          <p className="text-[0.875rem] font-semibold text-[#78716C] mb-1.5">Using automatic category list</p>
          <p className="text-[0.8rem] text-[#A8A29E]">Add at least one entry here to switch to a manually curated list</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, i) => (
            <CategoryCard
              key={section.id}
              section={section}
              index={i}
              total={sections.length}
              catOptions={catOptions}
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
