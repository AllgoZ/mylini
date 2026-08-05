'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Package, User } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Home', href: '/', icon: Home, exact: true, requiresAuth: false },
  { label: 'Cart', href: '/cart', icon: ShoppingBag, exact: false, requiresAuth: false },
  { label: 'Orders', href: '/orders', icon: Package, exact: false, requiresAuth: true },
  { label: 'Profile', href: '/account', icon: User, exact: false, requiresAuth: true },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const cartCount = useCartStore((s) => s.getItemCount());
  const { isAuthenticated, openLoginModal } = useAuthStore();

  useEffect(() => setIsMounted(true), []);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-canvas/95 backdrop-blur-xl border-t border-border-brand/60 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ label, href, icon: Icon, exact, requiresAuth }) => {
        const active = isActive(href, exact);
        const needsLogin = requiresAuth && isMounted && !isAuthenticated;

        const content = (
          <div className="relative flex flex-col items-center justify-center gap-0.5 py-2 min-w-11">
            <div className="relative">
              <Icon size={21} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-clay-deep' : 'text-text-light'} />
              {label === 'Cart' && isMounted && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-clay text-white text-[0.6rem] font-extrabold flex items-center justify-center border-2 border-canvas">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className={cn('text-[0.65rem] font-semibold', active ? 'text-clay-deep' : 'text-text-light')}>
              {label}
            </span>
          </div>
        );

        if (needsLogin) {
          return (
            <button
              key={href}
              onClick={() => openLoginModal()}
              className="flex-1 flex items-center justify-center"
            >
              {content}
            </button>
          );
        }

        return (
          <Link key={href} href={href} className="flex-1 flex items-center justify-center">
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
