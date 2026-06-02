'use client'

import { useState, useEffect } from 'react'
import { AdminDrawer } from './AdminDrawer'
import { adminCreateCoupon, adminUpdateCoupon } from '@/lib/api/admin/coupons'
import type { Coupon } from '@/types/coupon'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  coupon: Coupon | null
  onSaved: () => void
}

const INPUT = "w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] focus:ring-2 focus:ring-[#C4654A]/10 transition-all"

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.8rem] font-bold text-[#44403C]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

export function CouponDrawer({ open, onClose, coupon, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '', type: 'percentage' as 'percentage' | 'fixed',
    value: '', minimum_order: '0', usage_limit: '',
    expires_at: '', is_active: true,
  })

  useEffect(() => {
    if (!open) return
    if (coupon) {
      setForm({
        code: coupon.code,
        type: coupon.type,
        value: String(coupon.value),
        minimum_order: String(coupon.minimum_order),
        usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
        expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
        is_active: coupon.is_active,
      })
    } else {
      setForm({ code: '', type: 'percentage', value: '', minimum_order: '0', usage_limit: '', expires_at: '', is_active: true })
    }
  }, [open, coupon])

  const handleSave = async () => {
    if (!form.code || !form.value) { toast.error('Fill in all required fields'); return }
    setSaving(true)
    try {
      const data = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minimum_order: Number(form.minimum_order) || 0,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: form.is_active,
      }
      if (coupon) {
        await adminUpdateCoupon(coupon.id, data)
        toast.success('Coupon updated')
      } else {
        await adminCreateCoupon(data)
        toast.success('Coupon created')
      }
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <div className="flex items-center justify-between">
      <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#E7E5E4] text-[0.875rem] font-semibold text-[#44403C] hover:bg-[#F5F5F4] transition-colors">Cancel</button>
      <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] transition-colors disabled:opacity-60">
        {saving ? 'Saving…' : coupon ? 'Save Changes' : 'Create Coupon'}
      </button>
    </div>
  )

  return (
    <AdminDrawer open={open} onClose={onClose} title={coupon ? 'Edit Coupon' : 'New Coupon'} width={460} footer={footer}>
      <div className="space-y-4">
        <Field label="Coupon Code" required>
          <input className={`${INPUT} uppercase font-mono tracking-widest`} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. FEST20" maxLength={50} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Discount Type" required>
            <select className={INPUT} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </Field>
          <Field label={form.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} required>
            <input type="number" className={INPUT} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percentage' ? '20' : '200'} min="1" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Minimum Order (₹)">
            <input type="number" className={INPUT} value={form.minimum_order} onChange={e => setForm(f => ({ ...f, minimum_order: e.target.value }))} placeholder="0" min="0" />
          </Field>
          <Field label="Usage Limit">
            <input type="number" className={INPUT} value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} placeholder="Unlimited" min="1" />
          </Field>
        </div>

        <Field label="Expiry Date">
          <input type="date" className={INPUT} value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            className={`w-10 h-5.5 rounded-full transition-colors relative ${form.is_active ? 'bg-[#C4654A]' : 'bg-[#D6D3D1]'}`}>
            <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-[0.875rem] font-medium text-[#44403C]">Active</span>
        </label>
      </div>
    </AdminDrawer>
  )
}
