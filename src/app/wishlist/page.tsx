'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { useWishStore } from '@/store/useWishStore';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, toggleItem } = useWishStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-canvas" />;
  }

  const handleAddToCart = (product: any) => {
    addItem({ ...product, size: '4–5 yrs', quantity: 1 });
    toast.custom((t) => (
      <div className="w-[320px] bg-white/80 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-3 flex gap-3 items-center">
        <div className="w-14 h-16 bg-surface-2 rounded-xl overflow-hidden relative shrink-0 border border-border-soft">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E8C9B8] to-[#B87050]" />
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-[0.7rem] font-bold text-sage mb-0.5 uppercase tracking-[0.05em]">
            ✓ Added to Cart
          </div>
          <span className="text-[0.85rem] font-bold text-ink line-clamp-1 leading-tight">{product.name}</span>
        </div>
        <Link 
          href="/checkout" 
          onClick={() => toast.dismiss(t)} 
          className="bg-clay-deep text-white px-3 py-2 rounded-lg text-[0.8rem] font-bold shadow-s1 transition-transform hover:scale-105 shrink-0"
        >
          Checkout
        </Link>
      </div>
    ), { position: 'bottom-right', duration: 4000 });
  };

  const handleRemove = (product: any) => {
    toggleItem(product);
    toast.success('Removed from Favorites');
  };

  return (
    <div className="flex-1 bg-canvas py-10 md:py-16">
      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-10 md:mb-12">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[0.82rem] font-bold text-clay-soft hover:text-clay transition-colors mb-2">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="flex items-baseline justify-between border-b border-border-soft pb-5">
            <h1 className="font-head text-3xl md:text-4xl font-bold text-ink tracking-tight flex items-center gap-2.5">
              My Favorites <span className="font-body text-[1.2rem] text-text-light font-bold">({items.length})</span>
            </h1>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            /* Empty State */
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
                Explore our handpicked premium ethnic wear collections and save your favorite outfits here for celebrations.
              </p>
              <Link
                href="/"
                className="bg-clay-deep text-white px-8 py-3 rounded-full text-[0.88rem] font-bold shadow-s2 hover:bg-clay hover:scale-[1.01] transition-all"
              >
                Discover Collection
              </Link>
            </motion.div>
          ) : (
            /* Favorites Grid */
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
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
                  {/* Image container */}
                  <div className="relative aspect-[3/4] bg-surface-2 overflow-hidden flex items-end justify-center text-[5.5rem] bg-gradient-to-br from-[#EEDBCD]/40 to-[#FAF5F2]/40">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-[0.6s] ease-[--ease] group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <span className="mb-6 relative z-10 select-none drop-shadow-sm">👗</span>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(product)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-text-light hover:text-destructive hover:bg-white hover:scale-110 shadow-s1 transition-all z-10"
                      title="Remove from favorites"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Details section */}
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

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full flex items-center justify-center gap-1.5 p-2 bg-clay-deep text-white text-[0.78rem] font-bold rounded-lg transition-all hover:bg-clay"
                    >
                      <ShoppingBag size={14} /> Add to Cart
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
