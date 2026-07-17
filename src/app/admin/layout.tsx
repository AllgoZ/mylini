'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate)
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLoginPage = pathname === '/admin/login'

  // Auth itself is enforced server-side now — src/proxy.ts verifies the admin_token
  // cookie and redirects unauthenticated requests to /admin/login before this component
  // ever renders, so the client-side fetch('/api/admin/stats')-then-redirect check that
  // used to live here is gone (it was pure overhead once the server-side gate exists).
  useEffect(() => {
    if (!isLoginPage) hydrate()
  }, [isLoginPage, hydrate])

  if (isLoginPage) {
    return <>{children}</>
  }

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
