'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useWishStore } from '@/store/useWishStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FadeImage } from '@/components/ui/FadeImage';
import Link from 'next/link';
import type { ProductSummary } from '@/types/product';
import { getCardImageUrl } from '@/lib/utils/imageUrl';

interface ProductCardProps {
  product: ProductSummary;
  gradient?: string;
  emoji?: string;
  delay?: number;
  priority?: boolean;
}

export function ProductCard({
  product,
  gradient = 'from-[#E8C9B8] to-[#B87050]',
  emoji = '👗',
  delay = 0,
  priority = false,
}: ProductCardProps) {
  const { hasItem, toggleItem } = useWishStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isWished = mounted ? hasItem(product.id) : false;
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && product.images && product.images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
      }, 1000);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
    if (!isWished) toast.success('Added to Wishlist');
  };

  // Navigate to product detail on "Add to Cart" — user selects variant on detail page
  const productHref = `/product/${product.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <Link
        href={productHref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex flex-col h-full relative bg-canvas-warm border border-border-soft rounded-xl overflow-hidden transition-all duration-300 ease-[--spring] hover:-translate-y-1.5 hover:shadow-s4 hover:border-transparent"
      >
        <div className="relative aspect-[3/4] bg-surface-2 overflow-hidden">
          {product.images && product.images.length > 0 ? (
            product.images.map((img, idx) => (
              <FadeImage
                key={img}
                src={getCardImageUrl(img)}
                alt={`${product.name} ${idx + 1}`}
                fill
                fadeIn={false}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                priority={priority && idx === 0}
                className={cn(
                  'object-cover transition-opacity duration-500 ease-in-out',
                  idx === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                )}
              />
            ))
          ) : product.image ? (
            <FadeImage
              src={getCardImageUrl(product.image)}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={priority}
              className="object-cover"
            />
          ) : (
            <div className={cn('w-full h-full flex items-center justify-center text-[5.5rem] bg-gradient-to-br', gradient)}>
              <span className="block pt-8">{emoji}</span>
            </div>
          )}

          {/* Carousel dots */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {product.images.map((_, idx) => (
                <div
                  key={idx}
                  className={cn('h-1.5 rounded-full transition-all duration-300', idx === currentImageIndex ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/50')}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-ink/20 to-transparent pointer-events-none z-10" />

          {product.discountBadge && (
            <div className={cn(
              'absolute top-3 left-3 text-white text-[0.65rem] font-extrabold tracking-[0.04em] py-1 px-2.5 rounded-full z-20',
              product.isNew ? 'bg-sage' : 'bg-clay'
            )}>
              {product.discountBadge}
            </div>
          )}

          {/* Wishlist heart */}
          <button
            onClick={handleWish}
            aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
            className={cn(
              'absolute top-1.5 right-1.5 w-11 h-11 rounded-full bg-canvas/85 backdrop-blur-md flex items-center justify-center text-base shadow-s1 z-20 transition-all duration-[--t] ease-[--spring] hover:bg-white/95 active:scale-90',
              isWished ? 'opacity-100 scale-100 text-destructive' : 'opacity-0 scale-75 text-text-mid group-hover:opacity-100 group-hover:scale-100'
            )}
          >
            <Heart size={16} fill={isWished ? 'currentColor' : 'none'} strokeWidth={isWished ? 0 : 2} />
          </button>

          {/* Quick CTA — navigates to product page */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-ink/80 backdrop-blur-md text-white text-center text-[0.75rem] font-bold tracking-[0.05em] uppercase py-2 px-2.5 rounded-md opacity-0 translate-y-1.5 transition-all duration-[--t] ease-[--spring] z-20 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-ink">
            View Product
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="p-3.5 pb-4">
            <h3 className="font-body text-[0.85rem] font-semibold text-text leading-[1.4] mb-1.5 line-clamp-2">
              {product.name}
            </h3>
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
            <div className="w-full flex items-center justify-center gap-1.5 p-2.5 bg-clay-deep text-white text-[0.8rem] font-bold rounded-md transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:scale-[0.99]">
              View Details
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
