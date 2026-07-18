'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, RefreshCcw, ShieldCheck } from 'lucide-react';
import type { HomepageSection } from '@/types/homepage';

interface Props {
  sections: HomepageSection[]
}

function Slide({ section }: { section: HomepageSection | null }) {
  const title = section?.title ?? 'Comfort in Every Stitch.'
  const subtitle = section?.subtitle ?? 'Timeless ethnic wear crafted for your little ones — festivals, weddings & everyday magic.'
  const badgeText = section?.badge_text ?? 'New Collection 2026'
  const linkUrl = section?.link_url ?? '/shop/new'
  const linkText = section?.link_text ?? 'Shop Now'
  const imageUrl = section?.image_url ?? null
  const meta = (section?.metadata ?? {}) as Record<string, string>
  const secondaryLinkUrl = meta.secondary_link_url ?? '/collections'
  const secondaryLinkText = meta.secondary_link_text ?? 'View Collections'
  const offerText = meta.offer_text ?? '₹300 OFF on orders above ₹2500'

  return (
    <div className="snap-start shrink-0 w-full rounded-[28px] overflow-hidden bg-gradient-to-br from-[#3D1A0A] via-[#7A3520] to-[#E8927A] grid grid-cols-1 md:grid-cols-[1fr_1.1fr] min-h-[50vh] max-h-[65vh] md:min-h-[220px] md:max-h-none relative">
      {imageUrl && (
        <>
          <Image src={imageUrl} alt="" fill priority className="object-cover" sizes="100vw" />
          {/* Left-to-right darkening so white overlay text stays legible regardless of
              what the uploaded photo looks like, while the right side (badges/offer
              panel on desktop) still shows the photo clearly. */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
        </>
      )}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'120\' height=\'120\' viewBox=\'0 0 120 120\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'60\' cy=\'60\' r=\'50\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'.4\' stroke-opacity=\'.08\'/%3E%3Ccircle cx=\'60\' cy=\'60\' r=\'30\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'.4\' stroke-opacity=\'.06\'/%3E%3C/svg%3E')] bg-[center_300px] pointer-events-none" />

      <div className="p-6 md:p-8 md:pl-9 flex flex-col justify-center relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-white/90 w-fit mb-2.5 md:mb-3.5">
          ✦ {badgeText}
        </div>
        <h1 className="font-head text-[clamp(1.5rem,2.5vw,2.2rem)] font-bold text-white leading-[1.15] mb-2">
          {title.includes('\n') ? (
            title.split('\n').map((line, i) => (
              <span key={i}>{i > 0 && <br />}{i === 1 ? <em className="italic text-gold-pale">{line}</em> : line}</span>
            ))
          ) : (
            <>
              {title.split(',')[0]}{title.includes(',') && ','}<br />
              <em className="italic text-gold-pale">{title.split(',')[1]?.trim() ?? ''}</em>
            </>
          )}
        </h1>
        <p className="text-[0.85rem] text-white/70 leading-[1.5] mb-4 md:mb-5 max-w-[300px]">
          {subtitle}
        </p>
        <div className="flex gap-2.5 flex-wrap">
          <Link
            href={linkUrl}
            className="inline-flex items-center justify-center gap-2 min-h-11 bg-white text-clay-deep text-[0.85rem] font-bold py-2.5 px-5 rounded-full transition-all duration-[--t] ease-[--spring] hover:-translate-y-0.5 hover:shadow-s4"
          >
            {linkText} <ArrowRight size={14} />
          </Link>
          {secondaryLinkUrl && (
            <Link
              href={secondaryLinkUrl}
              className="inline-flex items-center justify-center gap-2 min-h-11 bg-white/15 border-[1.5px] border-white/40 text-white text-[0.85rem] font-semibold py-2.5 px-[19px] rounded-full transition-all duration-[--t] ease-[--spring] hover:bg-white/25 hover:-translate-y-0.5"
            >
              {secondaryLinkText}
            </Link>
          )}
        </div>
      </div>

      <div className="hidden md:flex items-end justify-center gap-3 p-5 relative z-10">
        <div className="flex flex-col gap-2 justify-center self-center mr-1">
          <div className="bg-white/20 border border-white/30 rounded-full py-2 px-3.5 flex items-center gap-2">
            <Truck size={18} className="text-white" />
            <div className="text-[0.78rem] text-white font-semibold leading-tight">
              Free Shipping
              <small className="block opacity-70 text-[0.68rem] font-normal mt-[1px]">Orders above ₹4000</small>
            </div>
          </div>
          <div className="bg-white/20 border border-white/30 rounded-full py-2 px-3.5 flex items-center gap-2">
            <RefreshCcw size={18} className="text-white" />
            <div className="text-[0.78rem] text-white font-semibold leading-tight">
              Easy Returns
              <small className="block opacity-70 text-[0.68rem] font-normal mt-[1px]">Within 30 days</small>
            </div>
          </div>
          <div className="bg-white/20 border border-white/30 rounded-full py-2 px-3.5 flex items-center gap-2">
            <ShieldCheck size={18} className="text-white" />
            <div className="text-[0.78rem] text-white font-semibold leading-tight">
              12,000+ Families
              <small className="block opacity-70 text-[0.68rem] font-normal mt-[1px]">Trust Mylini</small>
            </div>
          </div>
        </div>

        {offerText && (
          <div className="self-center bg-white/10 border border-white/25 rounded-[22px] p-4 px-5 text-center text-white">
            <div className="font-head text-[2rem] font-bold text-gold-pale leading-none">
              {offerText.match(/₹\d+/)?.[0] ?? '₹300'}
            </div>
            <div className="text-[0.7rem] font-semibold opacity-80 mt-1 tracking-[0.05em]">
              {offerText.replace(/₹\d+\s*/i, '').trim() || 'OFF on orders\nabove ₹2500'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const AUTO_ADVANCE_MS = 5000;

export function HeroBanner({ sections }: Props) {
  const slides = sections.length > 0 ? sections : [null];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  }, []);

  // Auto-advance — only meaningful with more than one slide, matches Myntra's
  // rotating-banner behavior. Paused implicitly whenever the user manually scrolls,
  // since the interval always advances relative to the last *reported* scroll position.
  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      setActiveIndex((i) => {
        const next = (i + 1) % slides.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [slides.length, scrollToIndex]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="w-full mt-6 px-4 md:px-7">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="relative"
      >
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory rounded-[28px]"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {slides.map((section, idx) => (
            <Slide key={section?.id ?? `fallback-${idx}`} section={section} />
          ))}
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full bg-white transition-all duration-300 ${
                  activeIndex === idx ? 'w-5 h-[5px] opacity-100' : 'w-[5px] h-[5px] opacity-50'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
