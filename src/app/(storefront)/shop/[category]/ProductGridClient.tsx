'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import type { ProductSummary } from '@/types/product';

const sizes = ['0–6M', '6–12M', '1–2 yrs', '3–4 yrs', '4–5 yrs', '5–6 yrs'];
const fabrics = ['Mysore Silk', 'Banarasi Silk', 'Pure Cotton', 'Organza'];

function toggleFilter(
  set: React.Dispatch<React.SetStateAction<string[]>>,
  current: string[],
  val: string
) {
  set(current.includes(val) ? current.filter((x) => x !== val) : [...current, val]);
}

export function ProductGridClient({ initialProducts }: { initialProducts: ProductSummary[] }) {
  const [priceRange, setPriceRange] = useState(10000);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const filteredProducts = initialProducts.filter((p) => p.price <= priceRange);

  return (
    <div className="w-full mx-auto px-4 md:px-8 lg:px-12 py-8 flex flex-col lg:flex-row gap-8 items-start">

      {/* Mobile Filter Button */}
      <div className="lg:hidden w-full flex items-center justify-between border-b border-border-soft pb-4 mb-2">
        <span className="font-semibold text-text">{filteredProducts.length} Products</span>
        <button
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="flex items-center gap-2 bg-surface px-4 py-2 rounded-full border border-border text-[0.85rem] font-bold text-ink"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {/* Filters Sidebar */}
      <aside className={`w-full lg:w-[260px] flex-shrink-0 flex-col gap-8 ${isMobileFilterOpen ? 'flex' : 'hidden lg:flex'}`}>
        {/* Price Range */}
        <div className="bg-white rounded-2xl p-5 border border-border-soft shadow-s1">
          <h3 className="text-[0.9rem] font-bold text-ink mb-4 flex justify-between items-center">
            Price Range <span className="text-clay text-[0.8rem] font-semibold">Up to ₹{priceRange.toLocaleString('en-IN')}</span>
          </h3>
          <input
            type="range" min="500" max="10000" step="100"
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-clay"
          />
          <div className="flex justify-between text-[0.7rem] text-text-light mt-2 font-semibold">
            <span>₹500</span><span>₹10,000+</span>
          </div>
        </div>

        {/* Size Filter */}
        <div className="bg-white rounded-2xl p-5 border border-border-soft shadow-s1">
          <h3 className="text-[0.9rem] font-bold text-ink mb-4">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleFilter(setSelectedSizes, selectedSizes, size)}
                className={`px-3 py-1.5 rounded-lg border text-[0.8rem] font-semibold transition-all duration-[--t] ${selectedSizes.includes(size) ? 'bg-clay-deep border-clay-deep text-white shadow-s2' : 'bg-surface border-border-soft text-text-mid hover:border-clay-soft hover:text-clay'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Fabric Filter */}
        <div className="bg-white rounded-2xl p-5 border border-border-soft shadow-s1">
          <h3 className="text-[0.9rem] font-bold text-ink mb-4">Fabric</h3>
          <div className="flex flex-col gap-3">
            {fabrics.map((fabric) => (
              <label key={fabric} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all duration-[--t] ${selectedFabrics.includes(fabric) ? 'bg-clay-deep border-clay-deep text-white' : 'bg-surface border-border group-hover:border-clay-soft'}`}>
                  {selectedFabrics.includes(fabric) && <Check size={12} strokeWidth={3} />}
                </div>
                <span className={`text-[0.85rem] font-semibold transition-colors ${selectedFabrics.includes(fabric) ? 'text-ink' : 'text-text-mid group-hover:text-text'}`}>
                  {fabric}
                </span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Product Grid */}
      <div className="flex-1">
        <div className="hidden lg:flex items-center justify-between mb-6">
          <span className="font-semibold text-text">{filteredProducts.length} Products</span>
          <div className="flex items-center gap-2 text-[0.85rem]">
            <span className="text-text-light font-semibold">Sort by:</span>
            <button className="flex items-center gap-1 font-bold text-ink hover:text-clay transition-colors">
              Recommended <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-head text-xl font-bold text-ink mb-2">No products found</h3>
            <p className="text-text-mid">Try adjusting your filters to see more results.</p>
            <button
              onClick={() => setPriceRange(10000)}
              className="mt-6 text-clay font-bold underline underline-offset-4"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
