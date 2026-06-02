'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminVerified, setAdminVerified] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/')
      return
    }

    // Verify admin access by calling the stats endpoint
    fetch('/api/admin/stats', { credentials: 'include' })
      .then((r) => {
        if (r.status === 403 || r.status === 401) {
          router.replace('/')
        } else {
          setAdminVerified(true)
        }
      })
      .catch(() => router.replace('/'))
      .finally(() => setChecking(false))
  }, [user, loading, router])

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C4654A]/30 border-t-[#C4654A] rounded-full animate-spin" />
          <span className="text-[0.85rem] text-[#78716C] font-medium">Loading admin...</span>
        </div>
      </div>
    )
  }

  if (!adminVerified) return null

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-[240px] min-h-screen">
        <AdminTopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
