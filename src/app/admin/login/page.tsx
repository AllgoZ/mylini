'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // If already has a valid admin session, go straight to dashboard
  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then((r) => { if (r.ok) router.replace('/admin') })
      .finally(() => setChecking(false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Login failed. Check your credentials.')
        return
      }

      router.replace('/admin')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C4654A]/30 border-t-[#C4654A] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="font-head text-[2rem] font-bold text-[#1C1917] tracking-[-0.02em]">
          My<span className="text-[#C4654A]">lini</span>
        </div>
        <p className="text-[0.82rem] text-[#6B7280] mt-1 font-medium">Admin Portal</p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.06)] w-full max-w-[440px] p-8">
        <div className="mb-6">
          <h1 className="text-[1.3rem] font-bold text-[#111827] mb-1">Sign in to your store</h1>
          <p className="text-[0.875rem] text-[#6B7280]">Enter your admin credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-semibold text-[#374151]">Email address</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="admin@mylini.com"
              className="w-full bg-white border border-[#D1D5DB] rounded-xl px-4 py-3 text-[0.875rem] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#C4654A] focus:ring-3 focus:ring-[#C4654A]/10 transition-all"
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-semibold text-[#374151]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                placeholder="Enter your password"
                className="w-full bg-white border border-[#D1D5DB] rounded-xl px-4 py-3 pr-11 text-[0.875rem] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#C4654A] focus:ring-3 focus:ring-[#C4654A]/10 transition-all"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <Lock size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[0.82rem] text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-[#C4654A] text-white text-[0.9rem] font-bold rounded-xl transition-all hover:bg-[#A0523A] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : 'Log in'}
          </button>
        </form>

        {/* Security note */}
        <div className="mt-5 pt-5 border-t border-[#F3F4F6]">
          <p className="text-[0.75rem] text-[#9CA3AF] text-center">
            This is a protected admin area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>

      {/* Back to storefront */}
      <a href="/" className="mt-6 text-[0.82rem] text-[#6B7280] hover:text-[#374151] transition-colors">
        ← Back to Mylini store
      </a>
    </div>
  )
}
