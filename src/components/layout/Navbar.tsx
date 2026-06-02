'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Heart, ShoppingBag, User, Menu } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MobileDrawer } from './MobileDrawer';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { fetchCart, getItemCount } = useCartStore();
  const { user, isAuthenticated, openLoginModal } = useAuthStore();
  const cartCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    setIsMounted(true);
    fetchCart();
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchCart]);

  const handleUserClick = () => {
    if (isAuthenticated) return; // Link href="/account" handles navigation
    openLoginModal();
  };

  return (
    <>
      <nav
        className={cn(
          'sticky top-0 z-[200] bg-canvas/80 backdrop-blur-[20px] backdrop-saturate-[1.8] border-b border-border-brand/60 transition-shadow duration-[0.22s] ease-[--ease]',
          isScrolled && 'shadow-s3'
        )}
      >
        <div className="w-full px-4 md:px-7 h-[62px] flex items-center gap-8">
          <Link href="/" className="font-head text-2xl font-bold text-clay-deep tracking-[-0.02em] shrink-0">
            My<span className="text-clay">lini</span>
          </Link>

          {/* Search Pill */}
          <div className="hidden md:flex flex-1 max-w-[460px] items-center gap-2.5 bg-surface-2 border-[1.5px] border-border-soft rounded-full px-[18px] h-10 transition-all duration-[0.22s] focus-within:border-clay-soft focus-within:shadow-[0_0_0_3px_rgba(196,101,74,0.1)] focus-within:bg-canvas">
            <Search size={16} className="text-text-light shrink-0" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search sarees, pattupavadai, frocks..."
              className="flex-1 border-none bg-transparent outline-none font-body text-sm text-text placeholder:text-text-light"
            />
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex gap-6 ml-1">
            {[
              { label: 'Girls', href: '/shop/girls-traditional' },
              { label: 'Boys', href: '/shop/boys-traditional' },
              { label: 'Collections', href: '/collections' },
              { label: 'About Us', href: '/about' },
              { label: 'Contact', href: '/contact' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative text-[0.82rem] font-semibold tracking-[0.04em] uppercase text-text-mid px-0.5 py-1 transition-colors hover:text-clay-deep"
              >
                {item.label}
                <span className="absolute bottom-[-2px] left-0 w-0 h-[2px] bg-clay rounded-full transition-all duration-[0.22s] ease-[--ease] group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Icon Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Wishlist */}
            <Link href="/wishlist" className="relative w-10 h-10 rounded-sm flex items-center justify-center text-text-mid transition-all hover:bg-surface-2 hover:text-clay-deep">
              <Heart size={20} strokeWidth={1.8} />
            </Link>

            {/* Cart with badge */}
            <Link href="/cart" className="relative w-10 h-10 rounded-sm flex items-center justify-center text-text-mid transition-all hover:bg-surface-2 hover:text-clay-deep">
              <ShoppingBag size={20} strokeWidth={1.8} />
              {isMounted && cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-clay text-white text-[0.6rem] font-extrabold flex items-center justify-center border-2 border-canvas">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User — account or login */}
            {isMounted && isAuthenticated ? (
              <Link
                href="/account"
                className="hidden md:flex relative w-10 h-10 rounded-sm items-center justify-center text-clay-deep transition-all hover:bg-rose-pale"
                title={user?.phone ?? 'Account'}
              >
                <User size={20} strokeWidth={1.8} />
              </Link>
            ) : (
              <button
                onClick={handleUserClick}
                className="hidden md:flex relative w-10 h-10 rounded-sm items-center justify-center text-text-mid transition-all hover:bg-surface-2 hover:text-clay-deep"
                title="Sign In"
              >
                <User size={20} strokeWidth={1.8} />
              </button>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden flex flex-col gap-[4.5px] p-2 rounded-xs hover:bg-surface-2 transition-colors"
            >
              <span className="block w-5 h-[1.8px] bg-text-mid rounded-sm" />
              <span className="block w-5 h-[1.8px] bg-text-mid rounded-sm" />
              <span className="block w-5 h-[1.8px] bg-text-mid rounded-sm" />
            </button>
          </div>
        </div>
      </nav>

      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
