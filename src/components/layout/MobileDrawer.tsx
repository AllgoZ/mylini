'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, LogOut } from 'lucide-react';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Logo } from './Logo';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
}

const navLinks = [
  { href: '/', label: '🏠 Home' },
  { href: '/shop/girls', label: '👗 Girls' },
  { href: '/shop/boys', label: '👘 Boys' },
  { href: '/collections', label: '✨ Collections' },
  { href: '/wishlist', label: '❤️ Wishlist' },
  { href: '/contact', label: '📞 Contact' },
  { href: '/about', label: 'ℹ️ About Us' },
];

// iOS-style ease-out for enter, ease-in for exit
const easeOut = [0.32, 0.72, 0, 1] as [number, number, number, number];
const easeIn  = [0.4, 0, 1, 1]    as [number, number, number, number];

const drawerVariants = {
  hidden: {
    x: '100%',
    transition: { type: 'tween' as const, duration: 0.22, ease: easeIn },
  },
  visible: {
    x: 0,
    transition: { type: 'tween' as const, duration: 0.3, ease: easeOut },
  },
};

const backdropVariants = {
  hidden: { opacity: 0, transition: { duration: 0.2, ease: 'linear' as const } },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'linear' as const } },
};

export function MobileDrawer({ isOpen, onClose, isAuthenticated }: MobileDrawerProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/');
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-[300] bg-ink/40 backdrop-blur-[3px]"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{ willChange: 'transform' }}
            className="fixed right-0 top-0 bottom-0 z-[301] w-[min(300px,85vw)] bg-canvas-warm shadow-s5 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-soft shrink-0">
              <Logo variant="dark" size="sm" />
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center text-text-mid hover:bg-border transition-colors"
                aria-label="Close menu"
              >
                <X size={17} />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3.5 text-[0.95rem] font-semibold text-text rounded-xl border-b border-border-soft/60 last:border-none transition-colors hover:bg-surface-2 hover:text-clay active:bg-surface-2"
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && (
                <div className="mt-4 pt-4 border-t border-border-soft">
                  <p className="px-3 mb-1 text-[0.7rem] font-bold text-text-light uppercase tracking-widest">
                    My Account
                  </p>
                  <Link
                    href="/orders"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3.5 text-[0.95rem] font-semibold text-text rounded-xl border-b border-border-soft/60 transition-colors hover:bg-surface-2 hover:text-clay active:bg-surface-2"
                  >
                    📦 My Orders
                  </Link>
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3.5 text-[0.95rem] font-semibold text-text rounded-xl border-b border-border-soft/60 transition-colors hover:bg-surface-2 hover:text-clay active:bg-surface-2"
                  >
                    👤 My Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3.5 text-[0.95rem] font-semibold text-destructive rounded-xl transition-colors hover:bg-red-50 active:bg-red-50"
                  >
                    <LogOut size={17} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
