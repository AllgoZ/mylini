'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, BarChart3, ShoppingBag, Tag, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Inventory', href: '/admin/inventory', icon: BarChart3 },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag },
  { label: 'Customers', href: '/admin/customers', icon: Users },
]

interface Props {
  mobileOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ mobileOpen, onClose }: Props) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-[240px] bg-[#1C1917] flex flex-col z-50 transition-transform duration-300',
          'lg:translate-x-0 lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-[62px] flex items-center justify-between px-5 border-b border-white/10 shrink-0">
          <Link href="/admin" className="font-head text-xl font-bold text-white tracking-[-0.02em]">
            My<span className="text-[#C4654A]">lini</span>
            <span className="ml-2 text-[0.6rem] font-bold tracking-[0.1em] uppercase text-white/40 bg-white/10 px-1.5 py-0.5 rounded">Admin</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-white/50 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-[0.65rem] font-bold tracking-[0.1em] uppercase text-white/30 px-3 mb-2">Menu</div>
          <ul className="space-y-0.5">
            {NAV.map(({ label, href, icon: Icon, exact }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[0.875rem] font-semibold transition-all duration-150',
                    isActive(href, exact)
                      ? 'bg-white/10 text-white'
                      : 'text-[#A8A29E] hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon size={18} strokeWidth={isActive(href, exact) ? 2 : 1.8} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Storefront link */}
        <div className="p-3 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[0.8rem] font-semibold text-white/40 hover:text-white/70 transition-colors"
          >
            <span className="text-[1rem]">🛍️</span> View Storefront
          </Link>
        </div>
      </aside>
    </>
  )
}
