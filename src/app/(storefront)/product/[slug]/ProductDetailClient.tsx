'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShieldCheck, Truck, Undo2, Heart, Minus, Plus, Search, Ruler, X as XIcon, ShoppingCart, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProductWithVariants, ProductSummary } from '@/types/product';
import { useCartStore } from '@/store/useCartStore';
import { useWishStore } from '@/store/useWishStore';
import { useAuthStore } from '@/store/useAuthStore';
import { adaptProductListItem } from '@/lib/utils/adapters';
import { getDetailImageUrl, getThumbImageUrl } from '@/lib/utils/imageUrl';
import { ProductCard } from '@/components/shop/ProductCard';
import { FadeImage } from '@/components/ui/FadeImage';
import { toast } from 'sonner';
import DOMPurify from 'isomorphic-dompurify';

// Only rendered after a user click, and only for the subset of products that have a size
// chart — no reason to ship it in the initial product-page bundle.
const SizeChartModal = dynamic(
  () => import('@/components/product/SizeChartModal').then((m) => m.SizeChartModal),
  { ssr: false }
);

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
  const [justAdded, setJustAdded] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductSummary[]>([]);

  // Fetch related products on mount
  useEffect(() => {
    const categorySlug = product.category?.slug;
    if (!categorySlug) return;
    // Guard against a stale response landing after a fast client-side nav to another product
    let ignore = false;
    fetch(`/api/products?category=${categorySlug}&exclude=${product.id}&limit=8&sort=newest`)
      .then(r => r.json())
      .then(json => {
        if (ignore) return;
        if (json.data?.items) {
          setRelatedProducts(json.data.items.map((p: any) => adaptProductListItem(p)));
        }
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [product.id, product.category?.slug]);

  // Auto-dismiss "just added" bar after 4s
  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 4000);
    return () => clearTimeout(t);
  }, [justAdded]);

  // Mobile swipe gallery ref
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const { addItem } = useCartStore();
  const { hasItem, toggleItem } = useWishStore();
  const { openLoginModal } = useAuthStore();

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
  const availableStock = inventory?.stock_available ?? 0;
  const inStock = availableStock > 0;
  const lowStock = inStock && availableStock <= (inventory?.low_stock_threshold ?? 2);

  // Switching size/variant can change the stock ceiling — clamp the previously chosen
  // quantity so it never silently exceeds the new variant's availability.
  useEffect(() => {
    setStockError(null);
    setQuantity((q) => Math.min(q, Math.max(availableStock, 1)));
  }, [selectedVariantId, availableStock]);

  const images = useMemo(
    () => (product.images.length > 0 ? [...product.images].sort((a, b) => a.sort_order - b.sort_order) : []),
    [product.images]
  );

  // Defense-in-depth on top of save-time sanitization in ProductService — protects any
  // data that entered the DB before that fix shipped, or via a future save-path bypass.
  const sanitizedDescription = useMemo(
    () => (product.description ? DOMPurify.sanitize(product.description) : ''),
    [product.description]
  );

  // Warm the browser cache for the next/previous gallery image so clicking a thumbnail
  // (or swiping) resolves instantly instead of showing a flash while it decodes.
  useEffect(() => {
    if (images.length < 2) return;
    const preload = (idx: number) => {
      if (idx < 0 || idx >= images.length) return;
      const img = new Image();
      img.src = getDetailImageUrl(images[idx].public_url);
    };
    preload(activeImage + 1);
    preload(activeImage - 1);
  }, [activeImage, images]);

  // Sync dot indicator with mobile scroll position
  const handleMobileScroll = useCallback(() => {
    const el = mobileScrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImage(idx);
  }, []);

  // Tap a desktop thumbnail → also scroll the mobile slider
  const handleThumbnailClick = (idx: number) => {
    setActiveImage(idx);
    const el = mobileScrollRef.current;
    if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    // Purchase actions require auth. Must read live state via getState() here, not the
    // `isAuthenticated` destructured at render time — this same function is re-invoked
    // as the login-success callback, and that stale closure would still read `false`
    // even after login succeeds, silently re-opening the modal instead of adding the
    // item. Closure over variant/quantity is fine (those aren't going stale the same
    // way — the click-time selection is exactly what should survive the round-trip).
    if (!useAuthStore.getState().isAuthenticated) {
      openLoginModal(() => handleAddToCart());
      return;
    }

    setAdding(true);
    setStockError(null);
    try {
      await addItem(selectedVariant.id, quantity, {
        variant: {
          id: selectedVariant.id,
          sku: selectedVariant.sku,
          color: selectedVariant.color,
          size: selectedVariant.size,
          price_override: selectedVariant.price_override,
          inventory: inventory
            ? { stock_available: inventory.stock_available, low_stock_threshold: inventory.low_stock_threshold }
            : null,
        },
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          base_price: product.base_price,
          sale_price: product.sale_price,
        },
        primary_image: productSummary.image || null,
      });
      setJustAdded(true);
    } catch (e: any) {
      // A stale-state race (someone else bought the last piece between page load and
      // this click) is the only way this fires now that quantity is clamped client-side.
      // Show the real remaining count instead of the generic "Insufficient stock" message.
      if (e?.message?.includes('Insufficient stock')) {
        setStockError(
          availableStock > 0
            ? `Only ${availableStock} piece${availableStock === 1 ? '' : 's'} ${availableStock === 1 ? 'is' : 'are'} available.`
            : 'This item just went out of stock.'
        );
        setQuantity((q) => Math.min(q, Math.max(availableStock, 1)));
      } else {
        toast.error(e?.message ?? 'Failed to add to cart');
      }
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

          {/* ── MOBILE swipe gallery (hidden on sm+) ───────────────────────────── */}
          {images.length > 0 && (
            <div className="sm:hidden relative rounded-3xl overflow-hidden bg-surface-2">
              {/* Scroll container */}
              <div
                ref={mobileScrollRef}
                onScroll={handleMobileScroll}
                className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory"
                style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              >
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="snap-start shrink-0 w-full aspect-[3/4] relative bg-surface-2"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <FadeImage
                      src={getDetailImageUrl(img.public_url)}
                      alt={`${product.name} — image ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      priority={idx === 0}
                    />
                  </div>
                ))}
              </div>

              {/* Dot indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`rounded-full bg-white transition-all duration-300 ${
                        activeImage === idx ? 'w-5 h-[5px] opacity-100' : 'w-[5px] h-[5px] opacity-50'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Image count badge */}
              {images.length > 1 && (
                <div className="absolute top-3 right-3 bg-ink/50 backdrop-blur-md text-white text-[0.7rem] px-2.5 py-1 rounded-full font-semibold z-20 pointer-events-none">
                  {activeImage + 1} / {images.length}
                </div>
              )}
            </div>
          )}

          {/* ── DESKTOP gallery (hidden on mobile) ─────────────────────────────── */}
          <div className="hidden sm:flex flex-row gap-3 items-start">
            {/* Vertical thumbnail strip */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[560px] flex-shrink-0 scrollbar-none pr-0.5">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => handleThumbnailClick(idx)}
                    className={`w-[76px] h-[96px] rounded-xl flex-shrink-0 relative border-2 transition-all duration-[--t] ease-[--spring] overflow-hidden ${
                      activeImage === idx
                        ? 'border-clay shadow-[0_0_0_1px_var(--color-clay)]'
                        : 'border-transparent opacity-70 hover:opacity-100 hover:border-clay-soft'
                    }`}
                  >
                    <FadeImage
                      src={getThumbImageUrl(img.public_url)}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="76px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div
              className="flex-1 aspect-[3/4] rounded-3xl overflow-hidden bg-surface-2 flex items-center justify-center relative cursor-zoom-in hover:shadow-s4 transition-shadow"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {images.length > 0 ? (
                <FadeImage
                  src={getDetailImageUrl(images[activeImage]?.public_url ?? images[0].public_url)}
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
            </div>
          </div>
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
              <div className="flex justify-between items-center text-[0.85rem] font-bold text-text mb-3">
                <span>
                  Size{' '}
                  {selectedVariant?.size && (
                    <strong className="text-clay-deep">— {selectedVariant.size}</strong>
                  )}
                </span>
                {(product as any).size_chart_url && (
                  <button
                    onClick={() => setSizeChartOpen(true)}
                    className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-clay hover:text-clay-deep transition-colors"
                  >
                    <Ruler size={14} />
                    Size Chart
                  </button>
                )}
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
                      className={`px-5 py-2 rounded-md border-[1.5px] text-[0.85rem] font-semibold transition-all duration-[--t] disabled:opacity-40 disabled:cursor-not-allowed ${
                        selectedVariantId === v.id
                          ? 'bg-clay-deep border-clay-deep text-white'
                          : 'border-border text-text-mid hover:border-clay-soft hover:text-clay'
                      }`}
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
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-11 h-11 flex items-center justify-center text-text-mid transition-all hover:bg-surface-2 hover:text-clay active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Minus size={16} />
              </button>
              <div className="w-11 text-center font-bold text-[0.95rem] text-text border-x-[1.5px] border-border leading-[44px] select-none">
                {quantity}
              </div>
              <button
                onClick={() => setQuantity(Math.min(Math.max(availableStock, 1), quantity + 1))}
                disabled={inStock && quantity >= availableStock}
                className="w-11 h-11 flex items-center justify-center text-text-mid transition-all hover:bg-surface-2 hover:text-clay active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Low-stock badge — sits directly above the CTA, the spec-mandated spot */}
          {inStock && lowStock && (
            <div className="inline-flex items-center gap-1.5 bg-red-50 text-destructive border border-red-200 text-[0.75rem] font-bold px-3 py-1.5 rounded-full w-fit mb-3">
              Only {availableStock} left
            </div>
          )}

          {stockError && (
            <p className="text-destructive text-[0.8rem] font-semibold mb-3">{stockError}</p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2.5 mb-5.5">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || adding || !selectedVariant}
              className={`flex items-center justify-center gap-2 p-4 text-[0.95rem] font-extrabold rounded-xl transition-all duration-[--t] ease-[--spring] ${
                inStock
                  ? 'bg-clay-deep text-white hover:bg-clay hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(157,62,36,0.3)] disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed'
                  : 'bg-surface-2 text-text-light cursor-not-allowed'
              }`}
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

          {product.description && (
            <div className="mt-6 border-t border-border-soft pt-6">
              <h3 className="text-[0.75rem] font-bold text-ink mb-3 uppercase tracking-[0.06em]">Description</h3>
              <div
                className="text-[0.9rem] text-text-mid leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_h1]:text-lg [&_h1]:font-bold [&_h2]:font-bold [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 pb-16 md:pb-20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-head text-[1.3rem] md:text-[1.6rem] font-bold text-ink tracking-tight">You May Also Like</h2>
            {product.category && (
              <Link
                href={`/shop/${product.category.slug}`}
                className="flex items-center gap-1 text-[0.8rem] font-bold text-clay hover:text-clay-deep transition-colors"
              >
                View All <ChevronRight size={14} />
              </Link>
            )}
          </div>
          {/* Mobile: horizontal scroll; Desktop: grid */}
          <div
            className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2 md:grid md:grid-cols-4 md:overflow-visible md:pb-0"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
          >
            {relatedProducts.slice(0, 8).map((p, idx) => (
              <div key={p.id} className="snap-start shrink-0 w-[160px] sm:w-[190px] md:w-auto">
                <ProductCard product={p} delay={idx * 0.06} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Size Chart Overlay */}
      <SizeChartModal
        open={sizeChartOpen}
        sizeChartUrl={(product as any).size_chart_url ?? ''}
        onClose={() => setSizeChartOpen(false)}
      />

      {/* View Cart Bar — appears after successful add */}
      <AnimatePresence>
        {justAdded && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[360px] z-[60] flex items-center gap-4 bg-ink text-white rounded-2xl px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          >
            <div className="w-8 h-8 bg-sage rounded-full flex items-center justify-center shrink-0">
              <ShoppingCart size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[0.88rem] leading-tight">Added to cart!</p>
              <p className="text-[0.75rem] text-white/60 font-medium line-clamp-1">{product.name}</p>
            </div>
            <Link
              href="/cart"
              onClick={() => setJustAdded(false)}
              className="shrink-0 flex items-center gap-1 bg-white text-ink text-[0.8rem] font-extrabold px-3.5 py-2 rounded-xl hover:bg-clay hover:text-white transition-colors"
            >
              View Cart <ChevronRight size={13} />
            </Link>
            <button
              onClick={() => setJustAdded(false)}
              aria-label="Dismiss"
              className="shrink-0 text-white/40 hover:text-white transition-colors p-2.5 -m-2.5"
            >
              <XIcon size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
