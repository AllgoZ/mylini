import Link from 'next/link';
import { Logo } from './Logo';
import { WhatsAppSubscribe } from '@/components/home/WhatsAppSubscribe';

export function Footer() {
  return (
    <footer className="bg-ink text-white/65 pt-14 pb-7 px-7">
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-white/10 mb-7">

          {/* Brand Col */}
          <div>
            <div className="mb-2.5">
              <Logo variant="light" size="md" />
            </div>
            <p className="text-[0.85rem] leading-[1.75] max-w-[260px] mb-5">
              From Coimbatore, to your little ones worldwide. Crafting timeless ethnic luxury since 2016.
            </p>
            <div className="flex gap-2">
              {/* Instagram */}
              <a href="https://www.instagram.com/mylini.official" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-white/55 transition-all hover:bg-clay hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://www.facebook.com/mylini.ventures" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-white/55 transition-all hover:bg-clay hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="https://x.com/mylini_in" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"
                className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-white/55 transition-all hover:bg-clay hover:text-white">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="https://www.linkedin.com/company/mylini-ventures/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-white/55 transition-all hover:bg-clay hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop + Help & Info — two equal columns even on mobile */}
          <div className="grid grid-cols-2 gap-6 md:contents">
            {/* Shop Links */}
            <div>
              <h4 className="text-[0.72rem] font-extrabold tracking-[0.14em] uppercase text-white mb-4">Shop</h4>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Boys', href: '/shop/boys' },
                  { label: 'Girls', href: '/shop/girls' },
                  { label: 'Collections', href: '/collections' },
                ].map((link) => (
                  <Link key={link.label} href={link.href} className="text-[0.85rem] text-white/50 transition-all hover:text-clay-soft hover:pl-1">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Help Links */}
            <div>
              <h4 className="text-[0.72rem] font-extrabold tracking-[0.14em] uppercase text-white mb-4">Help & Info</h4>
              <div className="flex flex-col gap-2.5">
                {['Track Order', 'Shipping & Returns', 'Size Guide', 'Contact Us', 'FAQs'].map((link) => (
                  <Link key={link} href="#" className="text-[0.85rem] text-white/50 transition-all hover:text-clay-soft hover:pl-1">
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* WhatsApp Updates */}
          <WhatsAppSubscribe variant="footer" />

        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-[0.78rem] text-white/30">
            © {new Date().getFullYear()} Mylini. All rights reserved.
          </div>
          <div className="flex gap-1.5">
            <span className="py-[3px] px-[9px] rounded bg-white/10 text-[0.68rem] font-extrabold text-white/40 tracking-[0.04em]">VISA</span>
            <span className="py-[3px] px-[9px] rounded bg-white/10 text-[0.68rem] font-extrabold text-white/40 tracking-[0.04em]">MC</span>
            <span className="py-[3px] px-[9px] rounded bg-white/10 text-[0.68rem] font-extrabold text-white/40 tracking-[0.04em]">UPI</span>
            <span className="py-[3px] px-[9px] rounded bg-white/10 text-[0.68rem] font-extrabold text-white/40 tracking-[0.04em]">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
