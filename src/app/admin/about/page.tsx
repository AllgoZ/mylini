'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Eye, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { AboutPageContent, AboutStat, AboutValue } from '@/types/about'
import { CmsImageUpload } from '@/components/admin/CmsImageUpload'

const INPUT = 'w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all'
const LABEL = 'block text-[0.78rem] font-semibold text-[#78716C] mb-1.5'
const CARD = 'bg-white rounded-2xl border border-[#E7E5E4] p-5 md:p-6 shadow-sm space-y-4'

// Same 12 keys as ICON_MAP in about/AboutPageClient.tsx — keep both lists in sync when
// adding an option.
const ICON_OPTIONS = [
  'heart', 'award', 'sparkles', 'smile', 'star', 'shield',
  'truck', 'gift', 'sun', 'users', 'leaf', 'crown',
]

const EMPTY_VALUE: AboutValue = { icon: 'heart', title: '', description: '' }

type FormState = Omit<AboutPageContent, 'id' | 'updated_at'>

const EMPTY_FORM: FormState = {
  eyebrow_text: '', heading_line1: '', heading_line2: '', intro_text: '',
  narrative_image_url: '', narrative_heading_line1: '', narrative_heading_line2: '',
  narrative_paragraph1: '', narrative_paragraph2: '',
  stats: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }],
  values_heading: '', values_subtitle: '', values: [EMPTY_VALUE],
  cta_heading: '', cta_text: '', cta_button1_text: '', cta_button1_link: '', cta_button2_text: '', cta_button2_link: '',
}

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    fetch('/api/admin/about', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        const c = j.data as AboutPageContent
        if (!c) return
        const { id: _id, updated_at: _u, ...rest } = c
        setForm(rest)
      })
      .catch(() => toast.error('Failed to load About Us content'))
      .finally(() => setLoading(false))
  }, [])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const setStat = (idx: number, field: keyof AboutStat) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, stats: f.stats.map((s, i) => i === idx ? { ...s, [field]: e.target.value } : s) }))

  const setValue = (idx: number, field: keyof AboutValue) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, values: f.values.map((v, i) => i === idx ? { ...v, [field]: e.target.value } : v) }))

  const addValue = () => {
    if (form.values.length >= 8) { toast.error('Maximum 8 value cards'); return }
    setForm(f => ({ ...f, values: [...f.values, { ...EMPTY_VALUE }] }))
  }

  const removeValue = (idx: number) => {
    if (form.values.length <= 1) { toast.error('At least 1 value card is required'); return }
    setForm(f => ({ ...f, values: f.values.filter((_, i) => i !== idx) }))
  }

  const moveValue = (idx: number, dir: 'up' | 'down') => {
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= form.values.length) return
    setForm(f => {
      const next = [...f.values]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return { ...f, values: next }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/about', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      toast.success('About Us page updated')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-40 bg-[#F5F5F4] rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#FAFAF9] z-10 py-2 -mx-1 px-1">
        <div>
          <h1 className="font-body text-[1.35rem] font-bold text-[#1C1917] tracking-tight">About Us</h1>
          <p className="text-[0.82rem] text-[#78716C] mt-0.5">Every section of the /about page — header, story, values, and call-to-action</p>
        </div>
        <div className="flex gap-2">
          <a href="/about" target="_blank" className="flex items-center gap-1.5 px-3 py-2 border border-[#E7E5E4] rounded-xl text-[0.82rem] font-semibold text-[#78716C] hover:bg-[#F5F5F4] transition-colors bg-white">
            <Eye size={14} /> Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#C4654A] text-white rounded-xl text-[0.875rem] font-bold hover:bg-[#A0523A] disabled:opacity-50 transition-colors"
          >
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Header */}
        <div className={CARD}>
          <p className="text-[0.85rem] font-bold text-[#1C1917]">Page Header</p>
          <div>
            <label className={LABEL}>Eyebrow Text</label>
            <input className={INPUT} value={form.eyebrow_text} onChange={set('eyebrow_text')} placeholder="Our Journey &amp; Philosophy" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Headline — Line 1</label>
              <input className={INPUT} value={form.heading_line1} onChange={set('heading_line1')} />
            </div>
            <div>
              <label className={LABEL}>Headline — Line 2 (italic)</label>
              <input className={INPUT} value={form.heading_line2} onChange={set('heading_line2')} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Intro Paragraph</label>
            <textarea className={`${INPUT} resize-none`} rows={3} value={form.intro_text} onChange={set('intro_text')} />
          </div>
        </div>

        {/* Narrative */}
        <div className={CARD}>
          <p className="text-[0.85rem] font-bold text-[#1C1917]">Story Section</p>
          <CmsImageUpload
            value={form.narrative_image_url}
            onChange={url => setForm(f => ({ ...f, narrative_image_url: url }))}
            folder="about"
            label="Story Image"
            aspectHint="Recommended: 1000 × 1250 px (portrait, 4:5)"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Heading — Line 1</label>
              <input className={INPUT} value={form.narrative_heading_line1} onChange={set('narrative_heading_line1')} />
            </div>
            <div>
              <label className={LABEL}>Heading — Line 2</label>
              <input className={INPUT} value={form.narrative_heading_line2} onChange={set('narrative_heading_line2')} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Paragraph 1</label>
            <textarea className={`${INPUT} resize-none`} rows={3} value={form.narrative_paragraph1} onChange={set('narrative_paragraph1')} />
          </div>
          <div>
            <label className={LABEL}>Paragraph 2</label>
            <textarea className={`${INPUT} resize-none`} rows={3} value={form.narrative_paragraph2} onChange={set('narrative_paragraph2')} />
          </div>

          <div>
            <p className={LABEL}>Stats Row (3 fixed slots)</p>
            <div className="grid grid-cols-3 gap-3">
              {form.stats.map((stat, idx) => (
                <div key={idx} className="border border-[#E7E5E4] rounded-xl p-3 space-y-2">
                  <input className={INPUT} value={stat.value} onChange={setStat(idx, 'value')} placeholder="10K+" />
                  <input className={INPUT} value={stat.label} onChange={setStat(idx, 'label')} placeholder="Families" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values */}
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <p className="text-[0.85rem] font-bold text-[#1C1917]">Brand Values</p>
            <button
              type="button"
              onClick={addValue}
              className="flex items-center gap-1.5 text-[0.78rem] font-bold text-[#C4654A] hover:text-[#A0523A] transition-colors"
            >
              <Plus size={14} /> Add Value
            </button>
          </div>
          <div>
            <label className={LABEL}>Section Heading</label>
            <input className={INPUT} value={form.values_heading} onChange={set('values_heading')} />
          </div>
          <div>
            <label className={LABEL}>Section Subtitle</label>
            <input className={INPUT} value={form.values_subtitle} onChange={set('values_subtitle')} />
          </div>

          <div className="space-y-3">
            {form.values.map((val, idx) => (
              <div key={idx} className="border border-[#E7E5E4] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.72rem] font-bold text-[#A8A29E] uppercase tracking-wider">Value {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={idx === 0} onClick={() => moveValue(idx, 'up')} className="disabled:opacity-30 p-1 hover:bg-[#F0EDE9] rounded transition-colors">
                      <ChevronUp size={14} />
                    </button>
                    <button type="button" disabled={idx === form.values.length - 1} onClick={() => moveValue(idx, 'down')} className="disabled:opacity-30 p-1 hover:bg-[#F0EDE9] rounded transition-colors">
                      <ChevronDown size={14} />
                    </button>
                    <button type="button" onClick={() => removeValue(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors ml-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-3">
                  <div>
                    <label className={LABEL}>Icon</label>
                    <select className={INPUT} value={val.icon} onChange={setValue(idx, 'icon')}>
                      {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Title</label>
                    <input className={INPUT} value={val.title} onChange={setValue(idx, 'title')} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea className={`${INPUT} resize-none`} rows={2} value={val.description} onChange={setValue(idx, 'description')} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={CARD}>
          <p className="text-[0.85rem] font-bold text-[#1C1917]">Bottom Call-to-Action</p>
          <div>
            <label className={LABEL}>Heading</label>
            <input className={INPUT} value={form.cta_heading} onChange={set('cta_heading')} />
          </div>
          <div>
            <label className={LABEL}>Text</label>
            <textarea className={`${INPUT} resize-none`} rows={2} value={form.cta_text} onChange={set('cta_text')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Button 1 Text</label>
              <input className={INPUT} value={form.cta_button1_text} onChange={set('cta_button1_text')} />
            </div>
            <div>
              <label className={LABEL}>Button 1 Link</label>
              <input className={INPUT} value={form.cta_button1_link} onChange={set('cta_button1_link')} placeholder="/shop/girls" />
            </div>
            <div>
              <label className={LABEL}>Button 2 Text</label>
              <input className={INPUT} value={form.cta_button2_text} onChange={set('cta_button2_text')} />
            </div>
            <div>
              <label className={LABEL}>Button 2 Link</label>
              <input className={INPUT} value={form.cta_button2_link} onChange={set('cta_button2_link')} placeholder="/shop/boys" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
