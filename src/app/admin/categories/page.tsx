'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Save, Trash2, Plus, ChevronUp, ChevronDown, ChevronRight, FolderTree } from 'lucide-react'
import type { Category } from '@/types/product'
import { adminListCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '@/lib/api/admin/categories'
import { CmsImageUpload } from '@/components/admin/CmsImageUpload'

const INPUT = 'w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all'
const LABEL = 'block text-[0.78rem] font-semibold text-[#78716C] mb-1.5'

function CategoryCard({
  category,
  indent,
  index,
  total,
  onSave,
  onDelete,
  onMove,
  extra,
}: {
  category: Category
  indent: boolean
  index: number
  total: number
  onSave: (id: string, patch: Partial<Category>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMove: (id: string, dir: 'up' | 'down') => void
  extra?: React.ReactNode
}) {
  const [form, setForm] = useState({
    name: category.name,
    slug: category.slug,
    image_url: category.image_url ?? '',
    is_active: category.is_active,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const set = (field: 'name' | 'slug') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(category.id, form).finally(() => setSaving(false))
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await onDelete(category.id).finally(() => setDeleting(false))
  }

  return (
    <div className={`bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden ${indent ? 'ml-6 md:ml-10' : ''}`}>
      <div
        className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-[#FAFAF9] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={e => { e.stopPropagation(); onMove(category.id, 'up') }}
            className="disabled:opacity-30 p-0.5 hover:bg-[#F0EDE9] rounded transition-colors"
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={e => { e.stopPropagation(); onMove(category.id, 'down') }}
            className="disabled:opacity-30 p-0.5 hover:bg-[#F0EDE9] rounded transition-colors"
          >
            <ChevronDown size={13} />
          </button>
        </div>

        {form.image_url ? (
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] flex items-center justify-center shrink-0 text-[#A8A29E]">
            <FolderTree size={16} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[0.875rem] text-[#1C1917] truncate">{form.name}</p>
          <p className="text-[0.75rem] text-[#78716C] truncate">/{form.slug}</p>
        </div>

        <span className={`shrink-0 text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-[#F5F5F4] text-[#78716C]'}`}>
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
              <label className={LABEL}>Name *</label>
              <input className={INPUT} value={form.name} onChange={set('name')} placeholder="Traditional" />
            </div>
            <div>
              <label className={LABEL}>Slug *</label>
              <input className={INPUT} value={form.slug} onChange={set('slug')} placeholder="traditional" />
            </div>
          </div>

          <CmsImageUpload
            value={form.image_url}
            onChange={url => setForm(f => ({ ...f, image_url: url }))}
            folder="categories"
            label="Category Image (optional)"
            aspectHint="Recommended: 300 × 300 px (square)"
          />

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

          {extra}
        </div>
      )}
    </div>
  )
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [addingTop, setAddingTop] = useState(false)
  const [addingChildFor, setAddingChildFor] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    adminListCategories()
      .then(setCategories)
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const bySiblingGroup = useMemo(() => {
    const map = new Map<string, Category[]>()
    for (const c of categories) {
      const key = c.parent_id ?? '__root__'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    map.forEach(list => list.sort((a, b) => a.sort_order - b.sort_order))
    return map
  }, [categories])

  const roots = bySiblingGroup.get('__root__') ?? []

  const handleSave = async (id: string, patch: Partial<Category>) => {
    try {
      const updated = await adminUpdateCategory(id, patch)
      setCategories(prev => prev.map(c => c.id === id ? updated : c))
      toast.success('Saved')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await adminDeleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success('Deleted')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleAddTop = async () => {
    setAddingTop(true)
    try {
      const cat = await adminCreateCategory('New Category')
      setCategories(prev => [...prev, cat])
      toast.success('Category added — rename it below')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAddingTop(false)
    }
  }

  const handleAddChild = async (parentId: string) => {
    setAddingChildFor(parentId)
    try {
      const cat = await adminCreateCategory('New Sub-category', parentId)
      setCategories(prev => [...prev, cat])
      toast.success('Sub-category added — rename it below')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAddingChildFor(null)
    }
  }

  // Recomputes sequential sort_order (0..n-1) for the whole sibling group after a
  // move, rather than swapping raw values — categories default to sort_order 0, so a
  // naive swap between two same-value siblings would be a no-op.
  const handleMove = async (parentKey: string, id: string, dir: 'up' | 'down') => {
    const list = bySiblingGroup.get(parentKey) ?? []
    const idx = list.findIndex(c => c.id === id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return

    const reordered = [...list]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]

    const updates = reordered.map((c, i) => ({ id: c.id, sort_order: i }))
    setCategories(prev => prev.map(c => {
      const u = updates.find(u => u.id === c.id)
      return u ? { ...c, sort_order: u.sort_order } : c
    }))
    await Promise.all(updates.map(u => adminUpdateCategory(u.id, { sort_order: u.sort_order }))).catch(() => {
      toast.error('Failed to save order')
      load()
    })
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
          <h1 className="font-body text-[1.35rem] font-bold text-[#1C1917] tracking-tight">Categories</h1>
          <p className="text-[0.82rem] text-[#78716C] mt-0.5">
            The real product catalog structure products are assigned to — e.g. Boys / Girls with Traditional / Western underneath.
            Not the same as Featured Categories (Content → homepage tiles).
          </p>
        </div>
        <button
          onClick={handleAddTop}
          disabled={addingTop}
          className="flex items-center gap-2 px-4 py-2 bg-[#C4654A] text-white rounded-xl text-[0.875rem] font-bold hover:bg-[#A0523A] disabled:opacity-50 transition-colors shrink-0"
        >
          <Plus size={15} /> {addingTop ? 'Adding…' : 'Add Category'}
        </button>
      </div>

      {roots.length === 0 ? (
        <div className="text-center py-16 text-[0.875rem] text-[#78716C]">
          No categories yet. Add one above.
        </div>
      ) : (
        <div className="space-y-3">
          {roots.map((root, i) => {
            const children = bySiblingGroup.get(root.id) ?? []
            return (
              <div key={root.id} className="space-y-2">
                <CategoryCard
                  category={root}
                  indent={false}
                  index={i}
                  total={roots.length}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onMove={(id, dir) => handleMove('__root__', id, dir)}
                  extra={
                    <div className="pt-3 border-t border-[#E7E5E4]">
                      <button
                        type="button"
                        onClick={() => handleAddChild(root.id)}
                        disabled={addingChildFor === root.id}
                        className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#C4654A] hover:text-[#A0523A] transition-colors"
                      >
                        <ChevronRight size={14} /> {addingChildFor === root.id ? 'Adding…' : 'Add Sub-category'}
                      </button>
                    </div>
                  }
                />
                {children.length > 0 && (
                  <div className="space-y-2">
                    {children.map((child, ci) => (
                      <CategoryCard
                        key={child.id}
                        category={child}
                        indent
                        index={ci}
                        total={children.length}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onMove={(id, dir) => handleMove(root.id, id, dir)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
