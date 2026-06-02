'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, Undo2, Heart, Minus, Plus, Search } from 'lucide-react';
import type { ProductWithVariants } from '@/types/product';
import { useCartStore } from '@/store/useCartStore';
import { useWishStore } from '@/store/useWishStore';
import { adaptProductListItem } from '@/lib/utils/adapters';
import { toast } from 'sonner';

interface Props {
  product: ProductWithVariants;
}

export function ProductDetailClient({ product }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id ?? ''
  );
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [adding, setAdding] = useState(false);

  const { addItem } = useCartStore();
  const { hasItem, toggleItem } = useWishStore();

  // Build product summary for wishlist
  const productSummary = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.sale_price ?? product.base_price,
    oldPrice: product.sale_price ? product.base_price : undefined,
    image: product.images[0]?.public_url ?? '',
    isNew: product.is_new_arrival,
  };

  const isWished = hasItem(product.id);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const effectivePrice = selectedVariant?.price_override ?? product.sale_price ?? product.base_price;
  const inventory = selectedVariant?.inventory;
  const inStock = (inventory?.stock_available ?? 0) > 0;
  const lowStock = inStock && (inventory?.stock_available ?? 0) <= (inventory?.low_stock_threshold ?? 2);

  const images = product.images.length > 0
    ? product.images.sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await addItem(selectedVariant.id, quantity);
      toast.success(`${product.name} added to cart`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = () => {
    toggleItem(productSummary);
    if (!isWished) toast.success('Added to Wishlist');
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Breadcrumbs */}
      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 mt-5 flex items-center gap-2 text-[0.8rem] text-text-light">
        <Link href="/" className="transition-colors hover:text-clay">Home</Link>
        <span className="text-border">/</span>
        {product.category && (
          <>
            <Link href={`/shop/${product.category.slug}`} className="transition-colors hover:text-clay capitalize">
              {product.category.name}
            </Link>
            <span className="text-border">/</span>
          </>
        )}
        <span className="text-text-mid font-semibold truncate">{product.name}</span>
      </div>

      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-7 md:py-10 pb-28 md:pb-20 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">

        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <motion.div
            className="aspect-square rounded-3xl overflow-hidden bg-surface-2 flex items-center justify-center relative cursor-zoom-in hover:shadow-s4 transition-shadow"
            onClick={() => setIsZoomed(!isZoomed)}
          >
            {images.length > 0 ? (
              <Image
                src={images[activeImage]?.public_url ?? images[0].public_url}
                alt={`${product.name} image ${activeImage + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#E8D8C0] to-[#B07840] flex items-center justify-center text-[8rem]">
                👗
              </div>
            )}
            <div className="absolute bottom-4 right-4 bg-ink/50 backdrop-blur-md text-white text-[0.72rem] px-3 py-1.5 rounded-full tracking-[0.04em] flex items-center gap-1.5 z-20 pointer-events-none">
              <Search size={14} /> Zoom
            </div>
          </motion.div>

          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(idx)}
                  className={`w-[72px] h-[72px] rounded-xl flex-shrink-0 relative border-2 transition-all duration-[--t] ease-[--spring] overflow-hidden ${activeImage === idx ? 'border-clay' : 'border-transparent hover:scale-105 hover:border-clay-soft'}`}
                >
                  <Image src={img.public_url} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" sizes="72px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div className="md:sticky md:top-[90px] flex flex-col">
          {product.is_best_seller && (
            <div className="inline-flex items-center gap-1.5 bg-rose-pale text-clay-deep border border-border text-[0.7rem] font-extrabold tracking-[0.07em] px-3 py-1.5 rounded-full w-fit mb-3.5 uppercase">
              ✦ Best Seller {lowStock && '· Limited Stock'}
            </div>
          )}

          <h1 className="font-head text-[clamp(1.4rem,2.5vw,2rem)] font-bold text-ink leading-[1.25] mb-3.5">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
            <span className="font-body text-[2rem] font-extrabold text-ink tracking-tight">
              ₹{effectivePrice.toLocaleString('en-IN')}
            </span>
            {product.sale_price && (
              <>
                <span className="font-body text-[1.1rem] font-medium text-text-light/80 line-through">
                  ₹{product.base_price.toLocaleString('en-IN')}
                </span>
                <span className="font-body text-[0.8rem] font-bold text-sage bg-[rgba(90,109,93,0.1)] px-2.5 py-1 rounded-full border border-[rgba(90,109,93,0.25)]">
                  Save {Math.round(((product.base_price - product.sale_price) / product.base_price) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Stock status */}
          <div className="flex items-center gap-2 text-[0.82rem] text-text-mid my-3.5">
            {inStock ? (
              <>
                <div className={`w-[7px] h-[7px] rounded-full ${lowStock ? 'bg-destructive animate-pulse' : 'bg-sage'}`} />
                {lowStock
                  ? <span className="text-destructive font-bold">Only {inventory?.stock_available} left!</span>
                  : <span className="text-sage font-bold">In Stock</span>
                }
              </>
            ) : (
              <>
                <div className="w-[7px] h-[7px] rounded-full bg-text-light" />
                <span className="text-text-light font-bold">Out of Stock</span>
              </>
            )}
          </div>

          {/* Attributes */}
          {product.attributes?.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 my-5">
              {product.attributes.slice(0, 4).map((attr) => (
                <div key={attr.id} className="flex items-center gap-2.5 bg-surface border border-border-soft rounded-md p-3">
                  <div>
                    <div className="text-[0.68rem] text-text-light font-semibold mb-0.5 uppercase tracking-[0.03em]">
                      {attr.key}
                    </div>
                    <div className="text-[0.82rem] text-text font-bold">{attr.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Variant / Size selection */}
          {product.variants.length > 0 && (
            <div className="mb-5">
              <div className="flex justify-between text-[0.85rem] font-bold text-text mb-3">
                <span>
                  Size{' '}
                  {selectedVariant?.size && (
                    <strong className="text-clay-deep">— {selectedVariant.size}</strong>
                  )}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {product.variants.map((v) => {
                  const label = v.size ?? v.color ?? v.sku;
                  const available = (v.inventory?.stock_available ?? 0) > 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={!available}
                      className={`px-5 py-2 rounded-md border-[1.5px] text-[0.85rem] font-semibold transition-all duration-[--t] disabled:opacity-40 disabled:cursor-not-allowed ${selectedVariantId === v.id ? 'bg-clay-deep border-clay-deep text-white' : 'border-border text-text-mid hover:border-clay-soft hover:text-clay'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-5.5">
            <span className="text-[0.85rem] font-bold text-text">Quantity</span>
            <div className="flex items-center border-[1.5px] border-border rounded-md overflow-hidden">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-text-mid transition-colors hover:bg-surface-2 hover:text-clay">
                <Minus size={16} />
              </button>
              <div className="w-11 text-center font-bold text-[0.95rem] text-text border-x-[1.5px] border-border leading-[40px] select-none">
                {quantity}
              </div>
              <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-10 h-10 flex items-center justify-center text-text-mid transition-colors hover:bg-surface-2 hover:text-clay">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2.5 mb-5.5">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || adding || !selectedVariant}
              className="flex items-center justify-center gap-2 p-4 bg-clay-deep text-white text-[0.95rem] font-extrabold rounded-xl transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(157,62,36,0.3)] disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : inStock ? '🛒 Add to Cart' : 'Out of Stock'}
            </button>
            <button
              onClick={handleWishlist}
              className="flex items-center justify-center gap-2 p-3.5 bg-canvas text-clay-deep text-[0.9rem] font-bold rounded-xl border-[1.5px] border-clay-deep transition-all duration-[--t] hover:bg-rose-pale"
            >
              <Heart size={18} fill={isWished ? 'currentColor' : 'none'} />
              {isWished ? 'Saved to Wishlist' : 'Save to Wishlist'}
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

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-canvas/90 backdrop-blur-xl border-t border-border-brand p-4 px-5 flex items-center justify-between z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="font-body text-[1.4rem] font-extrabold text-ink tracking-tight">
          ₹{(effectivePrice * quantity).toLocaleString('en-IN')}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!inStock || adding || !selectedVariant}
          className="bg-clay-deep text-white px-8 py-3 rounded-lg font-bold text-[0.9rem] shadow-s2 active:scale-95 transition-transform disabled:opacity-60"
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
