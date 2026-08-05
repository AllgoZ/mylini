'use client'

import { OBJECT_POSITION_CLASS } from '@/components/home/HeroBanner'

interface Props {
  title: string
  badgeText: string
  desktopImageUrl: string
  mobileImageUrl: string
  desktopPosition: string
  mobilePosition: string
}

const FALLBACK_BG = 'bg-gradient-to-br from-[#3D1A0A] via-[#7A3520] to-[#E8927A]'

function PreviewFrame({
  label,
  boxClassName,
  imageUrl,
  position,
  title,
  badgeText,
}: {
  label: string
  boxClassName: string
  imageUrl: string
  position: string
  title: string
  badgeText: string
}) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <span className="text-[0.68rem] font-bold text-[#A8A29E] uppercase tracking-wider">{label}</span>
      <div className={`relative overflow-hidden rounded-xl ${FALLBACK_BG} ${boxClassName}`}>
        {imageUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover ${OBJECT_POSITION_CLASS[position] ?? 'object-center'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
          </>
        )}
        <div className="absolute inset-0 p-3 flex flex-col justify-center">
          <div className="inline-flex items-center bg-white/15 border border-white/25 rounded-full px-2 py-0.5 text-[0.5rem] font-bold uppercase tracking-wide text-white/90 w-fit mb-1.5">
            {badgeText || 'Badge'}
          </div>
          <p className="text-white font-bold text-[0.7rem] leading-tight line-clamp-2">
            {title || 'Headline text'}
          </p>
        </div>
      </div>
    </div>
  )
}

// Rough, purpose-built approximation of the real HeroBanner shapes (portrait on mobile,
// wide landscape on desktop) — not a literal re-render of that responsive component,
// since it responds to viewport width via Tailwind's `md:` breakpoint, not the width of
// whatever narrow admin-panel container it would sit in. Close enough to judge crop and
// text legibility at a glance, which is the point.
export function BannerPreviewPanel({ title, badgeText, desktopImageUrl, mobileImageUrl, desktopPosition, mobilePosition }: Props) {
  return (
    <div className="flex flex-wrap gap-6 items-start bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-4">
      <PreviewFrame
        label="Mobile preview"
        boxClassName="w-[150px] h-[188px]"
        imageUrl={mobileImageUrl || desktopImageUrl}
        position={mobilePosition}
        title={title}
        badgeText={badgeText}
      />
      <PreviewFrame
        label="Desktop / laptop preview"
        boxClassName="w-[280px] h-[92px] md:w-[340px] md:h-[112px]"
        imageUrl={desktopImageUrl}
        position={desktopPosition}
        title={title}
        badgeText={badgeText}
      />
    </div>
  )
}
