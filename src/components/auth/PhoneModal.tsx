'use client'

import { useState } from 'react'
import { Phone, X } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { Logo } from '@/components/layout/Logo'

export function PhoneModal() {
  const { loginModalOpen, closeLoginModal, login } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!loginModalOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    try {
      await login(phone)
      setPhone('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeLoginModal}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] p-8 w-full max-w-[380px] border border-border-soft">
        <button
          onClick={closeLoginModal}
          aria-label="Close"
          className="absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center text-text-light hover:bg-surface-2 hover:text-text transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <Logo variant="dark" size="sm" className="mb-4" />
          <div className="w-14 h-14 rounded-2xl bg-rose-pale flex items-center justify-center text-clay mb-4">
            <Phone size={24} strokeWidth={1.8} />
          </div>
          <h2 className="font-head text-[1.5rem] font-bold text-ink mb-1.5">Sign In</h2>
          <p className="text-[0.88rem] text-text-mid leading-relaxed">
            Enter your phone number to continue.<br />
            We'll create an account if you're new.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="flex items-center border-[1.5px] border-border-soft rounded-xl overflow-hidden focus-within:border-clay focus-within:shadow-[0_0_0_3px_rgba(62,15,47,0.12)] transition-all bg-surface">
              <div className="px-3.5 py-3 text-[0.9rem] font-semibold text-text-mid border-r border-border-soft bg-surface-2 select-none">
                +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ''))
                  setError(null)
                }}
                placeholder="10-digit mobile number"
                className="flex-1 px-3.5 py-3 bg-transparent outline-none text-[0.95rem] text-ink placeholder:text-text-light"
                autoFocus
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-destructive text-[0.8rem] font-semibold mt-2 ml-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || phone.length !== 10}
            className="w-full py-3.5 bg-clay-deep text-white font-bold text-[0.95rem] rounded-xl transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(62,15,47,0.3)] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-[0.75rem] text-text-light mt-5 leading-relaxed">
          By continuing, you agree to our{' '}
          <span className="text-clay font-semibold">Terms of Service</span> and{' '}
          <span className="text-clay font-semibold">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
