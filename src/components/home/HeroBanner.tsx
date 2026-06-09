'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Truck, RefreshCcw, ShieldCheck } from 'lucide-react';
import type { HomepageSection } from '@/types/homepage';

interface Props {
  section?: HomepageSection | null
}

export function HeroBanner({ section }: Props) {
  const title = section?.title ?? 'Comfort in Every Stitch.'
  const subtitle = section?.subtitle ?? 'Timeless ethnic wear crafted for your little ones — festivals, weddings & everyday magic.'
  const badgeText = section?.badge_text ?? 'New Collection 2026'
  const linkUrl = section?.link_url ?? '/shop/new'
  const linkText = section?.link_text ?? 'Shop Now'
  const meta = (section?.metadata ?? {}) as Record<string, string>
  const secondaryLinkUrl = meta.secondary_link_url ?? '/collections'
  const secondaryLinkText = meta.secondary_link_text ?? 'View Collections'
  const offerText = meta.offer_text ?? '₹300 OFF on orders above ₹2500'

  return (
    <div className="w-full mt-6 px-4 md:px-7">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="rounded-[28px] overflow-hidden bg-gradient-to-br from-[#3D1A0A] via-[#7A3520] to-[#E8927A] p-0 grid grid-cols-1 md:grid-cols-[1fr_1.1fr] min-h-[220px] relative"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'120\' height=\'120\' viewBox=\'0 0 120 120\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'60\' cy=\'60\' r=\'50\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'.4\' stroke-opacity=\'.08\'/%3E%3Ccircle cx=\'60\' cy=\'60\' r=\'30\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'.4\' stroke-opacity=\'.06\'/%3E%3C/svg%3E')] bg-[center_300px] pointer-events-none" />

        <div className="p-7 md:p-8 md:pl-9 flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-white/90 w-fit mb-3.5">
            ✦ {badgeText}
          </div>
          <h1 className="font-head text-[clamp(1.6rem,2.5vw,2.2rem)] font-bold text-white leading-[1.15] mb-2.5">
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
          <p className="text-[0.88rem] text-white/70 leading-[1.55] mb-5 max-w-[300px]">
            {subtitle}
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <Link
              href={linkUrl}
              className="inline-flex items-center gap-2 bg-white text-clay-deep text-[0.85rem] font-bold py-2.5 px-5 rounded-full transition-all duration-[--t] ease-[--spring] hover:-translate-y-0.5 hover:shadow-s4"
            >
              {linkText} <ArrowRight size={14} />
            </Link>
            {secondaryLinkUrl && (
              <Link
                href={secondaryLinkUrl}
                className="inline-flex items-center gap-2 bg-white/15 border-[1.5px] border-white/40 text-white text-[0.85rem] font-semibold py-[9px] px-[19px] rounded-full transition-all duration-[--t] ease-[--spring] hover:bg-white/25 hover:-translate-y-0.5"
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
      </motion.div>
    </div>
  );
}
