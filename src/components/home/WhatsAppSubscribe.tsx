'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppSubscribeProps {
  /** "hero" = full-width homepage section. "footer" = compact footer column. */
  variant?: 'hero' | 'footer';
}

const HEADING = 'Get Updates on WhatsApp';
const SUBTITLE = 'Receive new arrivals, offers and festive collections instantly.';

// Store WhatsApp number — from the Contact page ("+91 95001 51606"), digits only for wa.me.
const STORE_WHATSAPP_NUMBER = '919500151606';

function useWhatsAppPhone() {
  const [phone, setPhone] = useState('');
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
  const onJoin = () => {
    // TODO: once a WhatsApp opt-in API is available, submit `phone` there instead of/in
    // addition to this direct chat-open redirect.
    const message = encodeURIComponent("Hi! I'd like to get updates on new arrivals, offers and festive collections.");
    window.open(`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener,noreferrer');
  };
  return { phone, onChange, onJoin };
}

export function WhatsAppSubscribe({ variant = 'hero' }: WhatsAppSubscribeProps) {
  const { phone, onChange, onJoin } = useWhatsAppPhone();

  if (variant === 'footer') {
    return (
      <div>
        <h4 className="flex items-center gap-1.5 text-[0.72rem] font-extrabold tracking-[0.14em] uppercase text-white mb-4">
          <MessageCircle size={14} className="text-gold" /> Get Updates on WhatsApp
        </h4>
        <p className="text-[0.85rem] text-white/50 mb-4">{SUBTITLE}</p>
        <div className="flex bg-white/10 rounded-full p-1 border border-white/20 focus-within:border-clay-soft transition-colors">
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={onChange}
            placeholder="Mobile Number"
            className="flex-1 bg-transparent border-none outline-none text-[0.85rem] text-white px-3 placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={onJoin}
            className="bg-gold text-ink text-[0.8rem] font-bold py-1.5 px-4 rounded-full transition-transform hover:scale-105 whitespace-nowrap"
          >
            Join WhatsApp
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-br from-rose-blush to-rose-pale py-[72px] px-7 text-center mt-16">
      <div className="max-w-[520px] mx-auto">
        <div className="w-14 h-14 rounded-full bg-white/70 flex items-center justify-center text-clay-deep mx-auto mb-4">
          <MessageCircle size={26} strokeWidth={1.8} />
        </div>
        <h2 className="font-head text-[2rem] font-bold text-clay-deep mb-2.5">{HEADING}</h2>
        <p className="text-[0.95rem] text-text-mid leading-[1.6] mb-7">{SUBTITLE}</p>
        <div className="flex flex-col sm:flex-row gap-2.5 max-w-[440px] mx-auto">
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={onChange}
            placeholder="Mobile Number"
            className="flex-1 h-12 px-5 border-[1.5px] border-border rounded-full font-body text-[0.9rem] bg-white text-text outline-none transition-all duration-[--t] focus:border-clay focus:shadow-[0_0_0_3px_rgba(62,15,47,0.12)] placeholder:text-text-light"
          />
          <button
            type="button"
            onClick={onJoin}
            className="h-12 px-6.5 bg-clay-deep text-white text-[0.88rem] font-bold rounded-full whitespace-nowrap transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:-translate-y-0.5"
          >
            Join WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}
