'use client'

import { Menu, LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'

interface Props {
  onMenuClick: () => void
  title?: string
}

export function AdminTopBar({ onMenuClick, title }: Props) {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace('/')
  }

  return (
    <header className="h-[62px] bg-white border-b border-[#E7E5E4] flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-[#78716C] hover:bg-[#F5F5F4] transition-colors"
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="font-head text-[1.1rem] font-bold text-[#1C1917] hidden md:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F5F4] border border-[#E7E5E4]">
          <div className="w-6 h-6 rounded-full bg-[#C4654A]/15 flex items-center justify-center text-[#C4654A]">
            <User size={14} />
          </div>
          <span className="text-[0.82rem] font-semibold text-[#44403C] hidden sm:block">
            +91 {user?.phone ?? '—'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-[#78716C] hover:bg-[#FEF2F2] hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
