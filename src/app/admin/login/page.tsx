'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Phone } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

export default function AdminLoginPage() {
  const { user, loading, hydrate, login } = useAuthStore()
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  // On mount, hydrate auth store (get existing session)
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // If already logged in, check admin and redirect
  useEffect(() => {
    if (loading || !user) return

    fetch('/api/admin/stats', { credentials: 'include' }).then((r) => {
      if (r.ok) {
        router.replace('/admin')
      } else {
        setAccessDenied(true)
      }
    })
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number')
      return
    }

    setSubmitting(true)
    try {
      await login(phone)
      // login() updates user in store; the useEffect above will then redirect
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#E7E5E4] shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-red-500" />
          </div>
          <h2 className="font-head text-[1.3rem] font-bold text-[#1C1917] mb-2">Access Denied</h2>
          <p className="text-[0.875rem] text-[#78716C] mb-6">
            Your account does not have admin privileges. Contact the store owner to request access.
          </p>
          <a
            href="/"
            className="inline-block w-full py-3 bg-[#1C1917] text-white text-[0.875rem] font-bold rounded-xl hover:bg-[#292524] transition-colors"
          >
            Return to Storefront
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-[#E7E5E4] shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="font-head text-[1.8rem] font-bold text-[#1C1917] tracking-[-0.02em] mb-1">
            My<span className="text-[#C4654A]">lini</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[#78716C] bg-[#F5F5F4] border border-[#E7E5E4] px-2.5 py-1 rounded-full">
            <Shield size={11} /> Admin Portal
          </div>
        </div>

        <h1 className="font-head text-[1.15rem] font-bold text-[#1C1917] mb-1 text-center">Sign in to Admin</h1>
        <p className="text-[0.82rem] text-[#78716C] text-center mb-6">Enter your registered admin phone number</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[0.8rem] font-bold text-[#44403C] block mb-1.5">
              Phone Number
            </label>
            <div className="flex items-center border border-[#E7E5E4] rounded-xl overflow-hidden focus-within:border-[#C4654A] focus-within:ring-2 focus-within:ring-[#C4654A]/10 transition-all bg-[#FAFAF9]">
              <div className="px-3.5 py-3 text-[0.875rem] font-semibold text-[#78716C] border-r border-[#E7E5E4] bg-[#F5F5F4] select-none">
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
                className="flex-1 px-3.5 py-3 bg-transparent outline-none text-[0.875rem] text-[#1C1917] placeholder:text-[#A8A29E]"
                autoFocus
                disabled={submitting}
              />
            </div>
            {error && (
              <p className="text-red-500 text-[0.78rem] font-semibold mt-1.5">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || phone.length !== 10}
            className="w-full py-3 bg-[#C4654A] text-white font-bold text-[0.875rem] rounded-xl hover:bg-[#A0523A] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(196,101,74,0.3)]"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#F5F5F4] text-center">
          <a href="/" className="text-[0.78rem] text-[#A8A29E] hover:text-[#78716C] transition-colors">
            ← Back to Storefront
          </a>
        </div>
      </div>
    </div>
  )
}
