'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowLeft, Phone } from 'lucide-react';
import { useWishStore } from '@/store/useWishStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';
import { getCardImageUrl } from '@/lib/utils/imageUrl';

export default function WishlistPage() {
  const { user, loading: authLoading, openLoginModal } = useAuthStore();
  const { items, loading, fetchWishlist, toggleItem } = useWishStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, fetchWishlist]);

  // Not authenticated — show sign in prompt
  if (!authLoading && !user) {
    return (
      <div className="flex-1 bg-canvas py-10 md:py-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center py-16 px-8 bg-canvas-warm border border-border-soft rounded-3xl max-w-md mx-auto shadow-s1"
        >
          <div className="w-16 h-16 rounded-full bg-rose-pale flex items-center justify-center text-clay mb-6">
            <Heart size={28} className="stroke-[1.8]" />
          </div>
          <h2 className="font-head text-2xl font-bold text-ink mb-2.5">Sign In to See Your Wishlist</h2>
          <p className="text-[0.88rem] text-text-mid leading-relaxed mb-8">
            Save your favourite ethnic wear collections and come back to them anytime.
          </p>
          <button
            onClick={() => openLoginModal()}
            className="flex items-center gap-2 bg-clay-deep text-white px-8 py-3 rounded-full text-[0.88rem] font-bold shadow-s2 hover:bg-clay transition-colors"
          >
            <Phone size={16} /> Sign In with Phone
          </button>
        </motion.div>
      </div>
    );
  }

  const handleAddToCart = async (product: any) => {
    // Wishlist items don't know variant_id — navigate to product page
    toast.info('Select size on the product page to add to cart');
  };

  const handleRemove = (product: any) => {
    toggleItem(product);
    toast.success('Removed from Favorites');
  };

  return (
    <div className="flex-1 bg-canvas py-10 md:py-16">
      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        <div className="flex flex-col gap-2 mb-10 md:mb-12">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[0.82rem] font-bold text-clay-soft hover:text-clay transition-colors mb-2">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="flex items-baseline justify-between border-b border-border-soft pb-5">
            <h1 className="font-head text-3xl md:text-4xl font-bold text-ink tracking-tight flex items-center gap-2.5">
              My Favorites{' '}
              <span className="font-body text-[1.2rem] text-text-light font-bold">({items.length})</span>
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-surface-2 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col items-center justify-center text-center py-20 px-4 bg-canvas-warm border border-border-soft rounded-3xl max-w-md mx-auto shadow-s1"
              >
                <div className="w-16 h-16 rounded-full bg-rose-pale flex items-center justify-center text-clay mb-6">
                  <Heart size={28} className="stroke-[1.8]" />
                </div>
                <h2 className="font-head text-xl font-bold text-ink mb-2.5">Your Favorites is Empty</h2>
                <p className="text-[0.88rem] text-text-mid leading-relaxed mb-8">
                  Explore our handpicked premium ethnic wear collections and save your favourite outfits here.
                </p>
                <Link
                  href="/"
                  className="bg-clay-deep text-white px-8 py-3 rounded-full text-[0.88rem] font-bold shadow-s2 hover:bg-clay hover:scale-[1.01] transition-all"
                >
                  Discover Collection
                </Link>
              </motion.div>
            ) : (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {items.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22 }}
                    className="group relative bg-white border border-border-soft rounded-2xl overflow-hidden flex flex-col justify-between shadow-s1 hover:shadow-s2 transition-all hover:-translate-y-0.5"
                  >
                    <Link href={`/product/${product.slug}`} className="relative aspect-[3/4] bg-surface-2 overflow-hidden flex items-end justify-center">
                      {product.image ? (
                        <Image
                          src={getCardImageUrl(product.image)}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-[0.6s] ease-[--ease] group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <span className="mb-6 relative z-10 select-none drop-shadow-sm text-[5.5rem]">👗</span>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); handleRemove(product); }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-text-light hover:text-destructive hover:bg-white hover:scale-110 shadow-s1 transition-all z-10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </Link>

                    <div className="p-3.5 pb-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h3 className="text-[0.82rem] font-semibold text-text leading-[1.4] mb-1.5 line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-baseline gap-[7px] flex-wrap">
                          <span className="font-body text-[1.05rem] font-extrabold text-ink tracking-tight">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {product.oldPrice && (
                            <span className="font-body text-[0.78rem] font-medium text-text-light/80 line-through">
                              ₹{product.oldPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/product/${product.slug}`}
                        className="w-full flex items-center justify-center gap-1.5 p-2 bg-clay-deep text-white text-[0.78rem] font-bold rounded-lg transition-all hover:bg-clay"
                      >
                        <ShoppingBag size={14} /> View Product
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
