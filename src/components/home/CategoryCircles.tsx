'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

const categories = [
  { label: 'Pattupavadai', image: '/products/product2/Ivory_Pistachio_Girls_Pattupavadai_Set_2249.webp', gradient: 'bg-[#F9EEF1]', active: true },
  { label: 'Pattufrock', image: '/products/product1/16.webp', gradient: 'bg-[#F0EDF6]' },
  { label: 'Boys Ethnic', image: '/products/product3/Mustard_Fuchsia_Girls_Traditional_Set_1.webp', gradient: 'bg-[#EBF1F9]' },
  { label: 'Traditional Sets', image: '/products/product3/84.webp', gradient: 'bg-[#F6EEED]' },
  { label: 'Banarasi Silk', image: '/products/product4/Purple_and_gold_mysore_silk.webp', gradient: 'bg-[#F2EDF0]' },
  { label: 'Mysore Silk', image: '/products/product5/Red_Emerald_Green_Girls_Pattupavadai_Set_3399.webp', gradient: 'bg-[#EFF3F0]' },
  { label: 'Festive Wear', image: '/products/product1/20.webp', gradient: 'bg-[#F5EDEF]' },
  { label: 'New Arrivals', image: '/products/product1/19.webp', gradient: 'bg-[#F5F2EA]' },
];

export function CategoryCircles() {
  return (
    <div className="w-full px-4 md:px-7 mt-10">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-head text-[1.5rem] font-bold text-ink tracking-[-0.02em]">Shop By Category</h2>
        <Link href="/collections" className="group flex items-center gap-1 text-[0.82rem] font-bold text-clay transition-all hover:gap-2">
          See all <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.08, ease: 'easeOut' }}
        className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-none"
      >
        {categories.map((cat, i) => (
          <Link
            key={i}
            href={`/shop/${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
            className="group flex flex-col items-center gap-3 shrink-0"
          >
            <div
              className={cn(
                "relative w-[76px] h-[90px] md:w-[94px] md:h-[110px] rounded-t-full rounded-b-2xl overflow-hidden flex items-end justify-center transition-all duration-[--t] ease-[--spring]",
                cat.gradient,
                "group-hover:scale-105 group-hover:-translate-y-1 group-hover:shadow-s3",
                cat.active && "shadow-[0_0_0_2px_var(--clay)]"
              )}
            >
              {/* Fallback color/gradient behind image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-10" />
              <div className="relative w-full h-full">
                <Image 
                  src={cat.image}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-[0.6s] ease-[--ease] group-hover:scale-110"
                  sizes="(max-width: 768px) 76px, 94px"
                />
              </div>
            </div>
            <div
              className={cn(
                "text-[0.72rem] md:text-[0.8rem] font-semibold text-center max-w-[80px] md:max-w-[94px] leading-tight",
                cat.active ? "text-clay-deep" : "text-text-mid group-hover:text-ink"
              )}
            >
              {cat.label}
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
