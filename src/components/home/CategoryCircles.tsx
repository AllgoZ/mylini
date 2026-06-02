import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { getCategories } from '@/lib/api/categories';

const FALLBACK_EMOJI: Record<string, string> = {
  traditional: '🏵️',
  'girls-traditional': '👗',
  'boys-traditional': '👘',
  'frocks-casual': '🌸',
};

const FALLBACK_GRADIENT: Record<string, string> = {
  traditional: 'bg-[#F9EEF1]',
  'girls-traditional': 'bg-[#F0EDF6]',
  'boys-traditional': 'bg-[#EBF1F9]',
  'frocks-casual': 'bg-[#F6EEED]',
};

const DEFAULT_GRADIENTS = [
  'bg-[#F9EEF1]', 'bg-[#F0EDF6]', 'bg-[#EBF1F9]',
  'bg-[#F6EEED]', 'bg-[#F2EDF0]', 'bg-[#EFF3F0]',
];
const DEFAULT_EMOJIS = ['🏵️', '👗', '👘', '🌸', '✨', '🎀'];

export async function CategoryCircles() {
  const categories = await getCategories().catch(() => []);

  // Show leaf categories (children) first, then root categories if no children exist
  const display = categories.flatMap((c) => (c.children?.length ? c.children : [c])).slice(0, 8);

  return (
    <div className="w-full px-4 md:px-7 mt-10">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-head text-[1.5rem] font-bold text-ink tracking-[-0.02em]">Shop By Category</h2>
        <Link href="/collections" className="group flex items-center gap-1 text-[0.82rem] font-bold text-clay transition-all hover:gap-2">
          See all <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-none">
        {display.map((cat, i) => {
          const gradient = FALLBACK_GRADIENT[cat.slug] ?? DEFAULT_GRADIENTS[i % DEFAULT_GRADIENTS.length];
          const emoji = FALLBACK_EMOJI[cat.slug] ?? DEFAULT_EMOJIS[i % DEFAULT_EMOJIS.length];

          return (
            <Link
              key={cat.id}
              href={`/shop/${cat.slug}`}
              className="group flex flex-col items-center gap-3 shrink-0"
            >
              <div
                className={cn(
                  'relative w-[76px] h-[90px] md:w-[94px] md:h-[110px] rounded-t-full rounded-b-2xl overflow-hidden flex items-end justify-center transition-all duration-[--t] ease-[--spring]',
                  gradient,
                  'group-hover:scale-105 group-hover:-translate-y-1 group-hover:shadow-s3'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-10" />
                {(cat as any).image_url ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={(cat as any).image_url}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-[0.6s] ease-[--ease] group-hover:scale-110"
                      sizes="(max-width: 768px) 76px, 94px"
                    />
                  </div>
                ) : (
                  <span className="relative z-10 text-[2.8rem] pb-2 select-none">{emoji}</span>
                )}
              </div>
              <div className="text-[0.72rem] md:text-[0.8rem] font-semibold text-center max-w-[80px] md:max-w-[94px] leading-tight text-text-mid group-hover:text-ink transition-colors">
                {cat.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
