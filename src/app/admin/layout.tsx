'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate)
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminVerified, setAdminVerified] = useState(false)
  const [checking, setChecking] = useState(true)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    // Login page needs no verification — just render it
    if (isLoginPage) {
      setChecking(false)
      return
    }

    // Directly verify admin session via API — no dependency on useAuthStore.loading
    // (AuthProvider lives in the storefront layout, not here)
    fetch('/api/admin/stats', { credentials: 'include' })
      .then((r) => {
        if (r.ok) {
          setAdminVerified(true)
          // Hydrate auth store so AdminTopBar can show user info
          hydrate()
        } else {
          router.replace('/admin/login')
        }
      })
      .catch(() => router.replace('/admin/login'))
      .finally(() => setChecking(false))
  }, [isLoginPage, router, hydrate])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C4654A]/30 border-t-[#C4654A] rounded-full animate-spin" />
          <span className="text-[0.85rem] text-[#78716C] font-medium">Loading…</span>
        </div>
      </div>
    )
  }

  if (!adminVerified) return null

  return (
    <div className="admin-root min-h-screen bg-[#FAFAF9] flex overflow-hidden">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-[240px] min-h-screen overflow-hidden">
        <AdminTopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
