'use client';

import { motion } from 'framer-motion';
import { Gift, Truck, Undo2, Lock } from 'lucide-react';

export function OfferStrip() {
  const offers = [
    {
      icon: Gift,
      title: '₹300 Off on ₹2500+',
      subtitle: 'Use code: MYLINI300',
    },
    {
      icon: Truck,
      title: 'Free Shipping above ₹4000',
      subtitle: 'Pan India delivery',
    },
    {
      icon: Undo2,
      title: '30-Day Easy Returns',
      subtitle: 'No questions asked',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      subtitle: 'Razorpay · UPI · COD',
    },
  ];

  return (
    <div
      className="w-full mt-4 px-4 md:px-7 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
      style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.08, ease: 'easeOut' }}
        className="flex flex-row gap-2 md:gap-3 min-w-max pb-1"
      >
        {offers.map((offer, index) => {
          const Icon = offer.icon;
          return (
            <div
              key={index}
              className="snap-center flex-shrink-0 w-[86vw] sm:w-[360px] md:flex-1 md:w-auto flex items-center gap-2.5 bg-surface border border-border-soft rounded-md p-3 px-4.5 transition-all duration-[--t] ease-[--spring] hover:shadow-s2 hover:-translate-y-px"
            >
              <div className="w-9 h-9 rounded-sm bg-rose-pale flex items-center justify-center shrink-0 text-clay-deep">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-[0.75rem] font-bold text-text leading-[1.2]">
                  {offer.title}
                </div>
                <div className="text-[0.68rem] text-text-light mt-[1px]">
                  {offer.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
