'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, ChevronLeft, Check, X, Tag } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import type { ProductSummary, ProductFilterMetadata } from '@/types/product';

interface Props {
  initialProducts: ProductSummary[];
  filterMetadata: ProductFilterMetadata | null;
  activeFilters: Record<string, string>;
  category: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular', label: 'Popular' },
];

export function ProductGridClient({ initialProducts, filterMetadata, activeFilters, category }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [priceMax, setPriceMax] = useState<number>(
    activeFilters.price_max ? Number(activeFilters.price_max) : (filterMetadata?.price_max ?? 10000)
  );

  const priceMin = filterMetadata?.price_min ?? 0;
  const priceMaxBound = filterMetadata?.price_max ?? 10000;

  const activeSize = activeFilters.size ?? '';
  const activeProductType = activeFilters.product_type ?? '';
  const activeTag = activeFilters.tag ?? '';
  const activeSort = activeFilters.sort ?? 'newest';

  const activeFilterCount = [
    activeSize,
    activeProductType,
    activeTag,
    activeFilters.price_max && Number(activeFilters.price_max) < priceMaxBound ? '1' : '',
  ].filter(Boolean).length;

  const buildUrl = useCallback((overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...activeFilters, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/shop/${category}?${params.toString()}`;
  }, [activeFilters, category]);

  const applyFilter = (overrides: Record<string, string | undefined>) => {
    startTransition(() => router.push(buildUrl(overrides)));
  };

  const clearAll = () => {
    setPriceMax(priceMaxBound);
    startTransition(() => router.push(`/shop/${category}`));
  };

  const handlePriceCommit = () => {
    applyFilter({ price_max: priceMax < priceMaxBound ? String(priceMax) : undefined });
  };

  const subcategories = filterMetadata?.subcategories ?? [];
  const parentCategory = filterMetadata?.parent_category ?? null;
  const tags = filterMetadata?.tags ?? [];

  return (
    <div className="w-full mx-auto px-4 md:px-8 lg:px-12 py-8 flex flex-col lg:flex-row gap-8 items-start">

      {/* Mobile filter button */}
      <div className="lg:hidden w-full flex items-center justify-between border-b border-border-soft pb-4 mb-2">
        <span className="font-semibold text-text">{initialProducts.length} Products</span>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-[0.8rem] text-clay-deep font-bold underline underline-offset-2">
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-2 bg-surface px-4 py-2 rounded-full border border-border text-[0.85rem] font-bold text-ink"
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-clay-deep text-white text-[0.65rem] font-extrabold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar filters */}
      <aside className={`w-full lg:w-[260px] flex-shrink-0 flex-col gap-5 ${isMobileFilterOpen ? 'flex' : 'hidden lg:flex'}`}>

        {/* Clear all (desktop) */}
        {activeFilterCount > 0 && (
          <div className="hidden lg:flex items-center justify-between">
            <span className="text-[0.8rem] font-bold text-ink">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
            <button onClick={clearAll} className="text-[0.8rem] text-clay-deep font-bold flex items-center gap-1 hover:underline">
              <X size={12} /> Clear all
            </button>
          </div>
        )}

        {/* ── Category navigation ── */}
        {subcategories.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-border-soft shadow-s1">
            <h3 className="text-[0.9rem] font-bold text-ink mb-3">Category</h3>

            {/* Parent link (only on leaf pages) */}
            {parentCategory && (
              <Link
                href={`/shop/${parentCategory.slug}`}
                className="flex items-center gap-1 text-[0.8rem] text-clay font-bold mb-3 hover:underline"
              >
                <ChevronLeft size={13} /> All {parentCategory.name}
              </Link>
            )}

            <div className="flex flex-wrap gap-2">
              {/* On a leaf page: show the current category as selected chip */}
              {parentCategory && (
                <span className="px-3 py-1.5 rounded-lg border text-[0.8rem] font-semibold bg-clay-deep border-clay-deep text-white">
                  {subcategories.length > 0
                    ? /* derive current name from slug */ category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    : ''}
                </span>
              )}

              {subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/shop/${sub.slug}`}
                  className="px-3 py-1.5 rounded-lg border text-[0.8rem] font-semibold transition-all duration-[--t] bg-surface border-border-soft text-text-mid hover:border-clay-soft hover:text-clay"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Price Range ── */}
        <div className="bg-white rounded-2xl p-5 border border-border-soft shadow-s1">
          <h3 className="text-[0.9rem] font-bold text-ink mb-4 flex justify-between items-center">
            Price Range
            <span className="text-clay text-[0.8rem] font-semibold">
              ₹{priceMin.toLocaleString('en-IN')} – ₹{priceMax.toLocaleString('en-IN')}
            </span>
          </h3>
          <input
            type="range"
            min={priceMin}
            max={priceMaxBound}
            step={Math.max(100, Math.floor((priceMaxBound - priceMin) / 100) * 10)}
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            onMouseUp={handlePriceCommit}
            onTouchEnd={handlePriceCommit}
            className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-clay"
          />
          <div className="flex justify-between text-[0.7rem] text-text-light mt-2 font-semibold">
            <span>₹{priceMin.toLocaleString('en-IN')}</span>
            <span>₹{priceMaxBound.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* ── Size ── */}
        {(filterMetadata?.sizes ?? []).length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-border-soft shadow-s1">
            <h3 className="text-[0.9rem] font-bold text-ink mb-4">Size</h3>
            <div className="flex flex-wrap gap-2">
              {filterMetadata!.sizes.map((size) => {
                const active = activeSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => applyFilter({ size: active ? undefined : size })}
                    className={`px-3 py-1.5 rounded-lg border text-[0.8rem] font-semibold transition-all duration-[--t] ${active ? 'bg-clay-deep border-clay-deep text-white shadow-s2' : 'bg-surface border-border-soft text-text-mid hover:border-clay-soft hover:text-clay'}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Product Type ── */}
        {(filterMetadata?.product_types ?? []).length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-border-soft shadow-s1">
            <h3 className="text-[0.9rem] font-bold text-ink mb-4">Product Type</h3>
            <div className="flex flex-col gap-3">
              {filterMetadata!.product_types.map((pt) => {
                const active = activeProductType === pt;
                return (
                  <label key={pt} className="flex items-center gap-3 cursor-pointer group" onClick={() => applyFilter({ product_type: active ? undefined : pt })}>
                    <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all duration-[--t] ${active ? 'bg-clay-deep border-clay-deep text-white' : 'bg-surface border-border group-hover:border-clay-soft'}`}>
                      {active && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className={`text-[0.85rem] font-semibold transition-colors ${active ? 'text-ink' : 'text-text-mid group-hover:text-text'}`}>
                      {pt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tags ── */}
        {tags.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-border-soft shadow-s1">
            <h3 className="text-[0.9rem] font-bold text-ink mb-4 flex items-center gap-2">
              <Tag size={15} className="text-clay" /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = activeTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => applyFilter({ tag: active ? undefined : tag })}
                    className={`px-3 py-1.5 rounded-full border text-[0.78rem] font-semibold transition-all duration-[--t] ${
                      active
                        ? 'bg-clay-deep border-clay-deep text-white shadow-s2'
                        : 'bg-surface border-border-soft text-text-mid hover:border-clay-soft hover:text-clay'
                    }`}
                  >
                    {active && <span className="mr-1">✕</span>}{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Product Grid */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <span className="font-semibold text-text">{initialProducts.length} Products</span>
          <div className="flex items-center gap-2 text-[0.85rem]">
            <span className="text-text-light font-semibold hidden sm:inline">Sort:</span>
            <div className="relative">
              <select
                value={activeSort}
                onChange={(e) => applyFilter({ sort: e.target.value })}
                className="appearance-none bg-surface border border-border-soft text-ink text-[0.85rem] font-bold rounded-lg pl-3 pr-8 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-clay-soft"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-mid" />
            </div>
          </div>
        </div>

        {/* Active tag pill (visible above grid) */}
        {activeTag && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[0.78rem] text-text-light font-semibold">Filtered by:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-clay-deep/10 text-clay-deep text-[0.78rem] font-bold rounded-full border border-clay-deep/20">
              <Tag size={11} /> {activeTag}
              <button onClick={() => applyFilter({ tag: undefined })} className="ml-0.5 hover:text-clay">
                <X size={11} />
              </button>
            </span>
          </div>
        )}

        {/* Loading overlay */}
        <div className={`relative transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {initialProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-head text-xl font-bold text-ink mb-2">No products found</h3>
              <p className="text-text-mid">Try adjusting your filters to see more results.</p>
              <button onClick={clearAll} className="mt-6 text-clay font-bold underline underline-offset-4">
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              <AnimatePresence>
                {initialProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                  >
                    <ProductCard product={product} priority={idx < 4} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
