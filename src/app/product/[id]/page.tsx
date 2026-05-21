'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Truck, Droplets, Undo2, ChevronRight, Search, Heart, Minus, Plus } from 'lucide-react';
import { bestSellers, newArrivals } from '@/data/mockProducts';
import { useCartStore } from '@/store/useCartStore';
import { useWishStore } from '@/store/useWishStore';
import { toast } from 'sonner';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  // Find product from mock data
  const allProducts = [...bestSellers, ...newArrivals];
  const product = allProducts.find(p => p.id === productId) || {
    id: productId,
    name: 'Ivory & Pistachio Girls Pattupavadai Set',
    price: 2249,
    oldPrice: 2499,
    image: '',
    rating: 4.9,
    reviews: 247,
  };

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('4–5 yrs');
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);

  const { addItem } = useCartStore();
  const { hasItem, toggleItem } = useWishStore();
  const isWished = hasItem(product.id);

  const images = [
    { emoji: '👗', gradient: 'from-[#E8D8C0] to-[#B07840]' },
    { emoji: '🌸', gradient: 'from-[#E0D0B8] to-[#A06830]' },
    { emoji: '🪡', gradient: 'from-surface-2 to-surface-2' },
    { emoji: '✨', gradient: 'from-surface-2 to-surface-2' },
    { emoji: '💚', gradient: 'from-[#C8D8C0] to-[#608050]' },
  ];

  const handleAddToCart = () => {
    addItem({ ...product, size: selectedSize, quantity });
    
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

  const handleWishlist = () => {
    toggleItem(product);
    toast.success(isWished ? 'Removed from Wishlist' : 'Added to Wishlist');
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Breadcrumbs */}
      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 mt-5 flex items-center gap-2 text-[0.8rem] text-text-light">
        <Link href="/" className="transition-colors hover:text-clay">Home</Link>
        <span className="text-border">/</span>
        <Link href="/shop/girls" className="transition-colors hover:text-clay">Girls</Link>
        <span className="text-border">/</span>
        <span className="text-text-mid font-semibold truncate">{product.name}</span>
      </div>

      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-7 md:py-10 pb-28 md:pb-20 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">
        {/* Left: Gallery */}
        <div className="flex flex-col gap-3">
          <motion.div 
            className="aspect-square rounded-3xl overflow-hidden bg-surface-2 flex items-center justify-center text-[10rem] relative cursor-zoom-in transition-shadow duration-[--t] hover:shadow-s4 bg-gradient-to-br"
            style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${images[activeImage].gradient} opacity-50`} />
            <motion.span 
              key={activeImage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: isZoomed ? 1.4 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10 select-none"
            >
              {images[activeImage].emoji}
            </motion.span>
            <div className="absolute bottom-4 right-4 bg-ink/50 backdrop-blur-md text-white text-[0.72rem] px-3 py-1.5 rounded-full tracking-[0.04em] flex items-center gap-1.5 z-20 pointer-events-none">
              <Search size={14} /> Zoom
            </div>
          </motion.div>
          
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-[72px] h-[72px] rounded-xl flex-shrink-0 flex items-center justify-center text-3xl border-2 transition-all duration-[--t] ease-[--spring] overflow-hidden relative ${activeImage === idx ? 'border-clay' : 'border-transparent hover:scale-105 hover:border-clay-soft'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${img.gradient} opacity-40 pointer-events-none`} />
                <span className="relative z-10">{img.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Details Panel */}
        <div className="md:sticky md:top-[90px] flex flex-col">
          <div className="inline-flex items-center gap-1.5 bg-rose-pale text-clay-deep border border-border text-[0.7rem] font-extrabold tracking-[0.07em] px-3 py-1.5 rounded-full w-fit mb-3.5 uppercase">
            ✦ Best Seller · Limited Stock
          </div>
          
          <h1 className="font-head text-[clamp(1.4rem,2.5vw,2rem)] font-bold text-ink leading-[1.25] mb-3.5">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-2.5 mb-4.5">
            <span className="text-[#F59E0B] text-[0.95rem]">★★★★★</span>
            <span className="text-[0.85rem] font-bold text-text">{product.rating}</span>
            <span className="text-[0.8rem] text-text-light">({product.reviews} reviews)</span>
            <span className="text-[0.78rem] text-sage font-bold ml-1.5 flex items-center gap-1">
              <ShieldCheck size={14} /> {product.reviews} verified
            </span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
            <span className="font-head text-[1.9rem] font-bold text-ink">₹{product.price.toLocaleString('en-IN')}</span>
            {product.oldPrice && (
              <>
                <span className="text-[1.05rem] text-text-light line-through">₹{product.oldPrice.toLocaleString('en-IN')}</span>
                <span className="text-[0.8rem] font-bold text-sage bg-[rgba(122,158,135,0.1)] px-2.5 py-1 rounded-full border border-[rgba(122,158,135,0.25)]">
                  Save {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[0.82rem] text-text-mid my-3.5">
            <div className="w-[7px] h-[7px] rounded-full bg-destructive animate-pulse" />
            <span><strong className="text-text">29 people</strong> are viewing this right now</span>
            <span className="text-border-brand mx-1">·</span>
            <span className="text-destructive font-bold">Only 1 left!</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-5">
            <div className="flex items-center gap-2.5 bg-surface border border-border-soft rounded-md p-3">
              <div className="text-[1.1rem]">🧵</div>
              <div><div className="text-[0.68rem] text-text-light font-semibold mb-0.5 uppercase tracking-[0.03em]">Material</div><div className="text-[0.82rem] text-text font-bold">Mysore Silk</div></div>
            </div>
            <div className="flex items-center gap-2.5 bg-surface border border-border-soft rounded-md p-3">
              <div className="text-[1.1rem]">🚚</div>
              <div><div className="text-[0.68rem] text-text-light font-semibold mb-0.5 uppercase tracking-[0.03em]">Delivery</div><div className="text-[0.82rem] text-text font-bold">May 22–26</div></div>
            </div>
            <div className="flex items-center gap-2.5 bg-surface border border-border-soft rounded-md p-3">
              <div className="text-[1.1rem]">🫧</div>
              <div><div className="text-[0.68rem] text-text-light font-semibold mb-0.5 uppercase tracking-[0.03em]">Care</div><div className="text-[0.82rem] text-text font-bold">Hand Wash</div></div>
            </div>
            <div className="flex items-center gap-2.5 bg-surface border border-border-soft rounded-md p-3">
              <div className="text-[1.1rem]">↩️</div>
              <div><div className="text-[0.68rem] text-text-light font-semibold mb-0.5 uppercase tracking-[0.03em]">Returns</div><div className="text-[0.82rem] text-text font-bold">30 Days Free</div></div>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex justify-between text-[0.85rem] font-bold text-text mb-3">
              <span>Size — <strong className="text-clay-deep">{selectedSize}</strong></span>
              <button className="text-clay font-semibold underline underline-offset-2">Size Guide</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['0–6M', '6–12M', '1–2 yrs', '3–4 yrs', '4–5 yrs', '5–6 yrs', '6–7 yrs'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-5 py-2 rounded-md border-[1.5px] text-[0.85rem] font-semibold transition-all duration-[--t] ${selectedSize === size ? 'bg-clay-deep border-clay-deep text-white' : 'border-border text-text-mid hover:border-clay-soft hover:text-clay'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5.5">
            <span className="text-[0.85rem] font-bold text-text">Quantity</span>
            <div className="flex items-center border-[1.5px] border-border rounded-md overflow-hidden">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-text-mid transition-colors hover:bg-surface-2 hover:text-clay"><Minus size={16} /></button>
              <div className="w-11 text-center font-bold text-[0.95rem] text-text border-x-[1.5px] border-border leading-[40px] select-none">{quantity}</div>
              <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-10 h-10 flex items-center justify-center text-text-mid transition-colors hover:bg-surface-2 hover:text-clay"><Plus size={16} /></button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mb-5.5">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 p-4 bg-clay-deep text-white text-[0.95rem] font-extrabold rounded-xl transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(157,62,36,0.3)]"
            >
              🛒 Add to Cart
            </button>
            <button
              onClick={handleWishlist}
              className="flex items-center justify-center gap-2 p-3.5 bg-canvas text-clay-deep text-[0.9rem] font-bold rounded-xl border-[1.5px] border-clay-deep transition-all duration-[--t] hover:bg-rose-pale"
            >
              <Heart size={18} fill={isWished ? 'currentColor' : 'none'} /> {isWished ? 'Saved to Wishlist' : 'Save to Wishlist'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-5 text-[0.8rem] text-text-mid font-semibold">
            <div className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-sage" /> Secure payment</div>
            <div className="flex items-center gap-1.5"><span className="text-[1.1rem]">✨</span> Authentic handcraft</div>
            <div className="flex items-center gap-1.5"><Truck size={16} className="text-clay" /> Free ship &gt;₹4000</div>
            <div className="flex items-center gap-1.5"><Undo2 size={16} className="text-text-light" /> 30-day returns</div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Add to Cart */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-canvas/90 backdrop-blur-xl border-t border-border-brand p-4 px-5 flex items-center justify-between z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe">
        <div className="font-head text-[1.4rem] font-bold text-ink">₹{(product.price * quantity).toLocaleString('en-IN')}</div>
        <button
          onClick={handleAddToCart}
          className="bg-clay-deep text-white px-8 py-3 rounded-lg font-bold text-[0.9rem] shadow-s2 active:scale-95 transition-transform"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
