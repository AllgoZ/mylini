'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AccountPage() {
  const { user, loading, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 bg-canvas py-16 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="h-8 w-40 bg-surface-2 rounded-lg animate-pulse mb-6" />
          <div className="h-24 bg-surface-2 rounded-2xl animate-pulse mb-4" />
          <div className="h-12 bg-surface-2 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <div className="flex-1 bg-canvas py-10 md:py-16">
      <div className="w-full max-w-lg mx-auto px-4">
        <h1 className="font-head text-3xl font-bold text-ink mb-8 tracking-tight">My Account</h1>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-border-soft shadow-s1 p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-pale flex items-center justify-center text-clay shrink-0">
              <User size={26} strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <div className="text-[0.72rem] font-bold text-text-light uppercase tracking-[0.06em] mb-1">Phone Number</div>
              <div className="font-head text-[1.2rem] font-bold text-ink flex items-center gap-2">
                <Phone size={16} className="text-clay shrink-0" />
                +91 {user.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="bg-white rounded-3xl border border-border-soft shadow-s1 overflow-hidden mb-4">
          <Link
            href="/orders"
            className="flex items-center justify-between p-5 border-b border-border-soft hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-clay" />
              <span className="font-semibold text-text">My Orders</span>
            </div>
            <ChevronRight size={18} className="text-text-light" />
          </Link>
          <Link
            href="/wishlist"
            className="flex items-center justify-between p-5 hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-[1.1rem]">❤️</span>
              <span className="font-semibold text-text">My Wishlist</span>
            </div>
            <ChevronRight size={18} className="text-text-light" />
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 p-4 bg-white border border-border-soft rounded-2xl text-destructive font-bold text-[0.95rem] shadow-s1 hover:bg-red-50 hover:border-red-200 transition-all"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
