'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useWishStore, ProductSummary } from '@/store/useWishStore';
import { useCartStore } from '@/store/useCartStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: ProductSummary;
  gradient?: string;
  emoji?: string;
  delay?: number;
}

export function ProductCard({ product, gradient = 'from-[#E8C9B8] to-[#B87050]', emoji = '👗', delay = 0 }: ProductCardProps) {
  const { hasItem, toggleItem } = useWishStore();
  const { addItem } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isWished = mounted ? hasItem(product.id) : false;

  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-scroll images on hover
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && product.images && product.images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
      }, 1000); // Change image every 1 second
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
    if (!isWished) {
      toast.success('Added to Wishlist');
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ ...product, size: '2-3 Yrs', quantity: 1 });
    
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <Link
        href={`/product/${product.id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex flex-col h-full relative bg-canvas-warm border border-border-soft rounded-xl overflow-hidden transition-all duration-300 ease-[--spring] hover:-translate-y-1.5 hover:shadow-s4 hover:border-transparent"
      >
        <div className="relative aspect-[3/4] bg-surface-2 overflow-hidden">
          {/* Render images with smooth crossfade, no scale on hover */}
          {product.images && product.images.length > 0 ? (
            product.images.map((img, idx) => (
              <Image 
                key={img}
                src={img}
                alt={`${product.name} ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className={cn(
                  "object-cover transition-opacity duration-700 ease-in-out",
                  idx === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                )}
              />
            ))
          ) : product.image ? (
            <Image 
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center text-[5.5rem] bg-gradient-to-br",
                gradient
              )}
            >
              <span className="block pt-8">{emoji}</span>
            </div>
          )}

          {/* Dots Indicator for Carousel */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {product.images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === currentImageIndex ? "w-4 bg-white shadow-sm" : "w-1.5 bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-ink/20 to-transparent pointer-events-none z-10" />

          {product.discountBadge && (
            <div className={cn(
              "absolute top-3 left-3 text-white text-[0.65rem] font-extrabold tracking-[0.04em] py-1 px-2.5 rounded-full z-20",
              product.isNew ? "bg-sage" : "bg-clay"
            )}>
              {product.discountBadge}
            </div>
          )}

          <button
            onClick={handleWish}
            className={cn(
              "absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-canvas/85 backdrop-blur-md flex items-center justify-center text-base shadow-s1 z-20 transition-all duration-[--t] ease-[--spring] hover:bg-white/95",
              isWished ? "opacity-100 scale-100 text-destructive" : "opacity-0 scale-75 text-text-mid group-hover:opacity-100 group-hover:scale-100"
            )}
          >
            <Heart size={16} fill={isWished ? 'currentColor' : 'none'} strokeWidth={isWished ? 0 : 2} />
          </button>

          <button
            onClick={handleQuickAdd}
            className="absolute bottom-2.5 left-2.5 right-2.5 bg-ink/80 backdrop-blur-md text-white text-center text-[0.75rem] font-bold tracking-[0.05em] uppercase py-2 px-2.5 rounded-md opacity-0 translate-y-1.5 transition-all duration-[--t] ease-[--spring] z-20 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-ink"
          >
            + Add to Cart
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="p-3.5 pb-4">
            <h3 className="text-[0.85rem] font-semibold text-text leading-[1.4] mb-1.5 line-clamp-2">
              {product.name}
            </h3>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[#F59E0B] text-[0.78rem] tracking-[0.02em]">
                {'★'.repeat(Math.round(product.rating || 5))}{'☆'.repeat(5 - Math.round(product.rating || 5))}
              </span>
              <span className="text-[0.72rem] text-text-light">({product.reviews || 0})</span>
            </div>
            <div className="flex items-baseline gap-[7px] flex-wrap">
              <span className="font-body text-[1.1rem] font-extrabold text-ink tracking-tight">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.oldPrice && (
                <>
                  <span className="font-body text-[0.8rem] font-medium text-text-light/80 line-through">
                    ₹{product.oldPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="font-body text-[0.72rem] font-bold text-sage">
                    −{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="px-3.5 pb-3.5">
            <button
              onClick={handleQuickAdd}
              className="w-full flex items-center justify-center gap-1.5 p-2.5 bg-clay-deep text-white text-[0.8rem] font-bold rounded-md transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:scale-[0.99]"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
