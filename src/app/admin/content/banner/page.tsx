'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Eye } from 'lucide-react'
import type { HomepageSection } from '@/types/homepage'
import { CmsImageUpload } from '@/components/admin/CmsImageUpload'

const INPUT = 'w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all'
const LABEL = 'block text-[0.78rem] font-semibold text-[#78716C] mb-1.5'

export default function BannerAdminPage() {
  const [banner, setBanner] = useState<HomepageSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    image_url: '',
    link_url: '/shop/new',
    link_text: 'Shop Now',
    is_active: true,
    metadata: {} as Record<string, unknown>,
  })

  useEffect(() => {
    fetch('/api/admin/content/sections', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        const b = (j.data as HomepageSection[])?.find(s => s.section_type === 'banner')
        if (b) {
          setBanner(b)
          setForm({
            title: b.title ?? '',
            subtitle: b.subtitle ?? '',
            badge_text: b.badge_text ?? '',
            image_url: b.image_url ?? '',
            link_url: b.link_url ?? '/shop/new',
            link_text: b.link_text ?? 'Shop Now',
            is_active: b.is_active,
            metadata: (b.metadata as Record<string, unknown>) ?? {},
          })
        }
      })
      .catch(() => toast.error('Failed to load banner'))
      .finally(() => setLoading(false))
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const setMeta = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, metadata: { ...f.metadata, [key]: e.target.value } }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = banner
        ? `/api/admin/content/sections/${banner.id}`
        : '/api/admin/content/sections'
      const method = banner ? 'PATCH' : 'POST'
      const body = banner
        ? form
        : { ...form, section_type: 'banner', sort_order: 0 }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      setBanner(json.data)
      toast.success('Banner saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#F5F5F4] rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-body text-[1.35rem] font-bold text-[#1C1917] tracking-tight">Homepage Banner</h1>
          <p className="text-[0.82rem] text-[#78716C] mt-0.5">Edit the hero banner shown at the top of the homepage</p>
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank" className="flex items-center gap-1.5 px-3 py-2 border border-[#E7E5E4] rounded-xl text-[0.82rem] font-semibold text-[#78716C] hover:bg-[#F5F5F4] transition-colors">
            <Eye size={14} /> Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#C4654A] text-white rounded-xl text-[0.875rem] font-bold hover:bg-[#A0523A] disabled:opacity-50 transition-colors"
          >
            <Save size={15} /> {saving ? 'Saving…' : 'Save Banner'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 mb-2">
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

        <div className="border-t border-[#E7E5E4] pt-4">
          <CmsImageUpload
            value={form.image_url}
            onChange={url => setForm(f => ({ ...f, image_url: url }))}
            folder="banner"
            label="Background Image"
            aspectHint="Recommended: 1200 × 500 px (landscape)"
          />
        </div>

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
      </div>
    </div>
  )
}
