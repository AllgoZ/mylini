'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    id: 1,
    name: 'Ramya K.',
    text: "Very comfortable, nice product. My kids absolutely love the feel of this! The fabric is so soft and the colours are exactly as shown. Will order again!",
    avatarBg: 'bg-[#F9D8D6]',
    emoji: '😊'
  },
  {
    id: 2,
    name: 'Sudha Ramasamy',
    text: "Mylini has that calm, premium feel. The clothes are comfortable and not heavy, which is very important for kids. Exactly what I was looking for!",
    avatarBg: 'bg-[#EBD6D6]',
    emoji: '🌺'
  },
  {
    id: 3,
    name: 'Priyanka M.',
    text: "Hands down the best outfits I've ordered online. The quality is outstanding, the sizing is accurate and delivery was faster than expected. Highly recommend!",
    avatarBg: 'bg-[#F5E6D3]',
    emoji: '🌟'
  },
  {
    id: 4,
    name: 'Deepa V.',
    text: "Beautiful craftsmanship! The Mysore silk dress I bought for my daughter is breathtaking. The finishing is flawless and it looks so elegant.",
    avatarBg: 'bg-[#D6E6E1]',
    emoji: '✨'
  },
  {
    id: 5,
    name: 'Anjali R.',
    text: "So happy with the Banarasi set. The colors are vibrant and true to the pictures. It’s perfect for festive occasions without being scratchy.",
    avatarBg: 'bg-[#E6DDF0]',
    emoji: '🎉'
  }
];

export function Testimonials() {
  // Duplicate array to create a seamless infinite loop
  const infiniteTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="w-full mt-20 overflow-hidden">
      <div className="px-4 md:px-7 mb-8">
        <h2 className="font-head text-[1.7rem] md:text-[2rem] font-bold text-ink tracking-[-0.02em]">
          Real Love From Parents
        </h2>
      </div>

      <div className="relative w-full overflow-hidden group">
        {/* Left/Right Fade Masks */}
        <div className="absolute top-0 bottom-0 left-0 w-12 md:w-24 bg-gradient-to-r from-canvas to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-12 md:w-24 bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none" />

        <div className="flex w-fit animate-marquee hover:[animation-play-state:paused]">
          {infiniteTestimonials.map((review, idx) => (
            <div 
              key={`${review.id}-${idx}`}
              className="w-[320px] md:w-[380px] shrink-0 mx-3 bg-surface border border-border-soft rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="flex gap-1 mb-4 text-[#F59E0B]">
                  {'★★★★★'.split('').map((star, i) => <span key={i} className="text-lg">{star}</span>)}
                </div>
                <p className="text-[0.95rem] text-text-mid italic leading-relaxed mb-6 font-medium">
                  "{review.text}"
                </p>
              </div>
              
              <div className="flex items-center gap-3 border-t border-border-soft pt-4 mt-auto">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0", review.avatarBg)}>
                  {review.emoji}
                </div>
                <div>
                  <h4 className="font-bold text-[0.9rem] text-ink">{review.name}</h4>
                  <div className="flex items-center gap-1 text-[0.75rem] font-bold text-sage">
                    <ShieldCheck size={14} /> Verified Buyer
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}</style>
    </section>
  );
}
