'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useEffect } from 'react';

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

export function MobileDrawer({ isOpen, onClose, isAuthenticated }: MobileDrawerProps) {
  // Lock body scroll when open
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] bg-ink/45 backdrop-blur-[4px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="fixed right-0 top-0 bottom-0 z-[301] w-[min(320px,88vw)] bg-canvas-warm shadow-s5 overflow-y-auto pb-10"
          >
            <div className="flex items-center justify-between p-5 px-6 border-b border-border-soft">
              <div className="font-head text-xl font-bold text-clay-deep">Mylini</div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-mid transition-colors hover:bg-border"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3 px-4 flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="block p-[14px_12px] text-base font-semibold text-text rounded-md border-b border-border-soft transition-all hover:bg-surface-2 hover:text-clay hover:pl-5"
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && (
                <div className="mt-3 pt-3 border-t border-border-soft flex flex-col gap-0.5">
                  <Link
                    href="/orders"
                    onClick={onClose}
                    className="block p-[14px_12px] text-base font-semibold text-text rounded-md border-b border-border-soft transition-all hover:bg-surface-2 hover:text-clay hover:pl-5"
                  >
                    📦 My Orders
                  </Link>
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="block p-[14px_12px] text-base font-semibold text-text rounded-md transition-all hover:bg-surface-2 hover:text-clay hover:pl-5"
                  >
                    👤 My Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
