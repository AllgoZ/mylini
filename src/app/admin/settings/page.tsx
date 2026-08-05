'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, KeyRound, Truck, AlertTriangle, Store } from 'lucide-react'
import type { AdminSettingsView } from '@/types/settings'

const INPUT = 'w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all'
const LABEL = 'block text-[0.78rem] font-semibold text-[#78716C] mb-1.5'
const CARD = 'bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm'

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

const emptySettingsForm = {
  shipping_charge: '150',
  free_shipping_threshold: '4000',
  tax_rate: '0',
  maintenance_mode: false,
  maintenance_message: '',
  store_name: 'MYLINI',
  store_email: '',
  store_phone: '',
  store_address: '',
  order_notification_email: '',
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptySettingsForm)
  const [emailOverride, setEmailOverride] = useState<string | null>(null)
  const [hasPasswordOverride, setHasPasswordOverride] = useState(false)

  const [credForm, setCredForm] = useState({ current_password: '', new_email: '', new_password: '', confirm_password: '' })
  const [savingCreds, setSavingCreds] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        const s = j.data as AdminSettingsView
        if (!s) return
        setForm({
          shipping_charge: String(s.shipping_charge),
          free_shipping_threshold: String(s.free_shipping_threshold),
          tax_rate: String(s.tax_rate),
          maintenance_mode: s.maintenance_mode,
          maintenance_message: s.maintenance_message ?? '',
          store_name: s.store_name,
          store_email: s.store_email ?? '',
          store_phone: s.store_phone ?? '',
          store_address: s.store_address ?? '',
          order_notification_email: s.order_notification_email ?? '',
        })
        setEmailOverride(s.admin_email_override)
        setHasPasswordOverride(s.has_password_override)
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shipping_charge: Number(form.shipping_charge),
          free_shipping_threshold: Number(form.free_shipping_threshold),
          tax_rate: Number(form.tax_rate),
          maintenance_mode: form.maintenance_mode,
          maintenance_message: form.maintenance_message,
          store_name: form.store_name,
          store_email: form.store_email,
          store_phone: form.store_phone,
          store_address: form.store_address,
          order_notification_email: form.order_notification_email,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      toast.success('Settings saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangeCredentials = async () => {
    setSavingCreds(true)
    try {
      const res = await fetch('/api/admin/settings/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: credForm.current_password,
          new_email: credForm.new_email || undefined,
          new_password: credForm.new_password || undefined,
          confirm_password: credForm.confirm_password || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update credentials')
      toast.success('Admin credentials updated')
      if (credForm.new_email) setEmailOverride(credForm.new_email)
      if (credForm.new_password) setHasPasswordOverride(true)
      setCredForm({ current_password: '', new_email: '', new_password: '', confirm_password: '' })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingCreds(false)
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-[#F5F5F4] rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-body text-[1.35rem] font-bold text-[#1C1917] tracking-tight">Settings</h1>
        <p className="text-[0.82rem] text-[#78716C] mt-0.5">Store configuration and admin account</p>
      </div>

      {/* Admin Account */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={16} className="text-[#C4654A]" />
          <h2 className="font-semibold text-[0.95rem] text-[#1C1917]">Admin Account</h2>
        </div>
        <p className="text-[0.75rem] text-[#9CA3AF] mb-4">
          Logging in as <span className="font-semibold text-[#57534E]">{emailOverride ?? 'the email set in your deployment environment'}</span>
          {hasPasswordOverride && ' · custom password set'}
        </p>
        <div className="space-y-3">
          <div>
            <label className={LABEL}>Current Password *</label>
            <input type="password" className={INPUT} value={credForm.current_password} onChange={(e) => setCredForm((f) => ({ ...f, current_password: e.target.value }))} placeholder="Required to confirm any change below" />
          </div>
          <div>
            <label className={LABEL}>New Email (optional)</label>
            <input type="email" className={INPUT} value={credForm.new_email} onChange={(e) => setCredForm((f) => ({ ...f, new_email: e.target.value }))} placeholder="Leave blank to keep current email" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>New Password (optional)</label>
              <input type="password" className={INPUT} value={credForm.new_password} onChange={(e) => setCredForm((f) => ({ ...f, new_password: e.target.value }))} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className={LABEL}>Confirm New Password</label>
              <input type="password" className={INPUT} value={credForm.confirm_password} onChange={(e) => setCredForm((f) => ({ ...f, confirm_password: e.target.value }))} />
            </div>
          </div>
          <button
            onClick={handleChangeCredentials}
            disabled={savingCreds || !credForm.current_password}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C1917] text-white rounded-xl text-[0.85rem] font-bold hover:bg-[#000] disabled:opacity-50 transition-colors"
          >
            <KeyRound size={14} /> {savingCreds ? 'Updating…' : 'Update Credentials'}
          </button>
        </div>
      </div>

      {/* Shipping & Tax */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-4">
          <Truck size={16} className="text-[#C4654A]" />
          <h2 className="font-semibold text-[0.95rem] text-[#1C1917]">Shipping & Tax</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Shipping Charge (₹)</label>
            <input type="number" min="0" className={INPUT} value={form.shipping_charge} onChange={set('shipping_charge')} />
          </div>
          <div>
            <label className={LABEL}>Free Shipping Above (₹)</label>
            <input type="number" min="0" className={INPUT} value={form.free_shipping_threshold} onChange={set('free_shipping_threshold')} />
          </div>
          <div>
            <label className={LABEL}>Tax Rate (%)</label>
            <input type="number" min="0" max="100" step="0.1" className={INPUT} value={form.tax_rate} onChange={set('tax_rate')} />
          </div>
        </div>
      </div>

      {/* Store Status */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-[#C4654A]" />
          <h2 className="font-semibold text-[0.95rem] text-[#1C1917]">Store Status</h2>
        </div>
        <Toggle
          checked={form.maintenance_mode}
          onChange={() => setForm((f) => ({ ...f, maintenance_mode: !f.maintenance_mode }))}
          label="Maintenance Mode"
          description="Blocks the storefront for all visitors — the admin panel stays reachable"
        />
        {form.maintenance_mode && (
          <div className="mt-3">
            <label className={LABEL}>Maintenance Message (optional)</label>
            <textarea rows={2} className={`${INPUT} resize-none`} value={form.maintenance_message} onChange={set('maintenance_message')} placeholder="We'll be right back — thanks for your patience!" />
          </div>
        )}
      </div>

      {/* Store Information */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-4">
          <Store size={16} className="text-[#C4654A]" />
          <h2 className="font-semibold text-[0.95rem] text-[#1C1917]">Store Information</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className={LABEL}>Store Name</label>
            <input type="text" className={INPUT} value={form.store_name} onChange={set('store_name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Store Email</label>
              <input type="email" className={INPUT} value={form.store_email} onChange={set('store_email')} />
            </div>
            <div>
              <label className={LABEL}>Store Phone</label>
              <input type="tel" className={INPUT} value={form.store_phone} onChange={set('store_phone')} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Store Address</label>
            <textarea rows={2} className={`${INPUT} resize-none`} value={form.store_address} onChange={set('store_address')} />
          </div>
          <div>
            <label className={LABEL}>Order Notification Email</label>
            <input type="email" className={INPUT} value={form.order_notification_email} onChange={set('order_notification_email')} placeholder="Defaults to the ORDER_NOTIFICATION_EMAIL environment variable" />
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#C4654A] text-white rounded-xl text-[0.9rem] font-bold hover:bg-[#A0523A] disabled:opacity-50 transition-colors"
      >
        <Save size={16} /> {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}
