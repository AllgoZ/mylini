import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-ink text-white/65 pt-14 pb-7 px-7">
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-white/10 mb-7">
          
          {/* Brand Col */}
          <div>
            <div className="font-head text-2xl font-bold text-white mb-2.5">
              My<span className="text-clay-soft">lini</span>
            </div>
            <p className="text-[0.85rem] leading-[1.75] max-w-[260px] mb-5">
              From Coimbatore, to your little ones worldwide. Crafting timeless ethnic luxury since 2016.
            </p>
            <div className="flex gap-2">
              <a href="#" className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-[0.85rem] text-white/55 transition-all hover:bg-clay hover:text-white">
                <span className="font-bold">in</span>
              </a>
              <a href="#" className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-[0.85rem] text-white/55 transition-all hover:bg-clay hover:text-white">
                <span className="font-bold">f</span>
              </a>
              <a href="#" className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-[0.85rem] text-white/55 transition-all hover:bg-clay hover:text-white">
                <span className="font-bold">X</span>
              </a>
              <a href="#" className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-[0.85rem] text-white/55 transition-all hover:bg-clay hover:text-white">
                <span className="font-bold">P</span>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-[0.72rem] font-extrabold tracking-[0.14em] uppercase text-white mb-4">Shop</h4>
            <div className="flex flex-col gap-2.5">
              {['Pattupavadai', 'Pattufrock', 'Boys Ethnic', 'New Arrivals', 'Festive Wear'].map((link) => (
                <Link key={link} href="#" className="text-[0.85rem] text-white/50 transition-all hover:text-clay-soft hover:pl-1">
                  {link}
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

          {/* Newsletter */}
          <div>
            <h4 className="text-[0.72rem] font-extrabold tracking-[0.14em] uppercase text-white mb-4">Stay in the Loop</h4>
            <p className="text-[0.85rem] text-white/50 mb-4">Subscribe for new collection drops and styling inspiration.</p>
            <div className="flex bg-white/10 rounded-full p-1 border border-white/20 focus-within:border-clay-soft transition-colors">
              <input 
                type="email" 
                placeholder="Enter email..." 
                className="flex-1 bg-transparent border-none outline-none text-[0.85rem] text-white px-3 placeholder:text-white/40"
              />
              <button className="bg-clay-soft text-ink text-[0.8rem] font-bold py-1.5 px-4 rounded-full transition-transform hover:scale-105">
                Join
              </button>
            </div>
          </div>

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
