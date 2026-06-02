export const dynamic = 'force-dynamic';

import { HeroBanner } from '@/components/home/HeroBanner';
import Image from 'next/image';
import { OfferStrip } from '@/components/home/OfferStrip';
import { CategoryCircles } from '@/components/home/CategoryCircles';
import { ProductCard } from '@/components/shop/ProductCard';
import { StorySection } from '@/components/home/StorySection';
import { Testimonials } from '@/components/home/Testimonials';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getProducts } from '@/lib/api/products';
import { adaptProductListItem } from '@/lib/utils/adapters';

const emojiSet1 = ['👗', '🌸', '🏵️', '💜'];
const gradientSet1 = [
  'from-[#E8C9B8] to-[#B87050]',
  'from-[#C8D8B8] to-[#507030]',
  'from-[#C8D8D8] to-[#407070]',
  'from-[#C8B8D8] to-[#604080]',
];

const emojiSet2 = ['✨', '🎀', '🏵️', '🌟'];
const gradientSet2 = [
  'from-[#D8C8B0] to-[#907040]',
  'from-[#D8C0C0] to-[#904040]',
  'from-[#D0D8C0] to-[#608050]',
  'from-[#D8D0C0] to-[#806040]',
];

export default async function Home() {
  const [bestSellersData, newArrivalsData] = await Promise.all([
    getProducts({ bestSeller: true, limit: 4 }).catch(() => null),
    getProducts({ newArrival: true, limit: 4 }).catch(() => null),
  ]);

  const bestSellers = (bestSellersData?.items ?? []).map(adaptProductListItem);
  const newArrivals = (newArrivalsData?.items ?? []).map(adaptProductListItem);

  return (
    <div className="flex flex-col min-h-screen">
      <HeroBanner />
      <OfferStrip />
      <CategoryCircles />

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="w-full px-4 md:px-7 mt-10">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-head text-[1.5rem] font-bold text-ink tracking-[-0.02em]">Best Sellers</h2>
            <Link href="/collections" className="group flex items-center gap-1 text-[0.82rem] font-bold text-clay transition-all hover:gap-2">
              View all <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {bestSellers.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                emoji={emojiSet1[i]}
                gradient={gradientSet1[i]}
                delay={0.1 * (i + 1)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Editorial Promos */}
      <section className="w-full px-4 md:px-7 mt-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/shop/girls-traditional" className="group relative rounded-xl overflow-hidden min-h-[220px] flex items-center transition-all duration-[--t] ease-[--spring] hover:scale-[1.015] hover:shadow-s4">
            <Image src="/products/cat_ban/Peach_dress_-_desktop_version.webp" alt="Pattupavadai Collection" fill className="object-cover transition-transform duration-[0.8s] group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            <div className="relative z-10 p-7 md:p-8">
              <div className="text-[0.68rem] font-bold tracking-[0.14em] uppercase text-white/80 mb-2">Girls · 0–7 Years</div>
              <h3 className="font-head text-[1.6rem] font-bold text-white leading-[1.2] mb-1.5 drop-shadow-sm">
                Pattupavadai<br /><em className="italic text-gold-pale">Collection</em>
              </h3>
              <p className="text-[0.85rem] text-white/90 mb-4 drop-shadow-sm">Handcrafted designs in premium silk</p>
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/40 text-white text-[0.8rem] font-bold py-2 px-4.5 rounded-full transition-colors group-hover:bg-white/30">
                Explore <ChevronRight size={14} />
              </div>
            </div>
          </Link>
          <Link href="/shop/frocks-casual" className="group relative rounded-xl overflow-hidden min-h-[220px] flex items-center transition-all duration-[--t] ease-[--spring] hover:scale-[1.015] hover:shadow-s4">
            <Image src="/products/cat_ban/Top_and_Skirt-_Desktop_Version.webp" alt="Frocks Collection" fill className="object-cover transition-transform duration-[0.8s] group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            <div className="relative z-10 p-7 md:p-8">
              <div className="text-[0.68rem] font-bold tracking-[0.14em] uppercase text-white/80 mb-2">Girls · 0–7 Years</div>
              <h3 className="font-head text-[1.6rem] font-bold text-white leading-[1.2] mb-1.5 drop-shadow-sm">
                Frocks &<br /><em className="italic text-gold-pale">Casual Wear</em>
              </h3>
              <p className="text-[0.85rem] text-white/90 mb-4 drop-shadow-sm">Festive designs starting ₹899</p>
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/40 text-white text-[0.8rem] font-bold py-2 px-4.5 rounded-full transition-colors group-hover:bg-white/30">
                Explore <ChevronRight size={14} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="w-full px-4 md:px-7 mt-14">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-head text-[1.5rem] font-bold text-ink tracking-[-0.02em]">New Arrivals</h2>
            <Link href="/collections" className="group flex items-center gap-1 text-[0.82rem] font-bold text-clay transition-all hover:gap-2">
              View all <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {newArrivals.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                emoji={emojiSet2[i]}
                gradient={gradientSet2[i]}
                delay={0.1 * (i + 1)}
              />
            ))}
          </div>
        </section>
      )}

      <StorySection />

      <Testimonials />

      {/* Newsletter */}
      <section className="bg-gradient-to-br from-rose-blush to-gold-pale py-[72px] px-7 text-center mt-16">
        <div className="max-w-[520px] mx-auto">
          <div className="text-[2.2rem] mb-4">✉️</div>
          <h2 className="font-head text-[2rem] font-bold text-clay-deep mb-2.5">Get 10% Off Your First Order</h2>
          <p className="text-[0.95rem] text-text-mid leading-[1.6] mb-7">
            Subscribe for new collection drops, exclusive offers, and styling inspiration for your little ones.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 max-w-[440px] mx-auto">
            <input
              type="email"
              placeholder="Enter your email..."
              className="flex-1 h-12 px-5 border-[1.5px] border-border rounded-full font-body text-[0.9rem] bg-white text-text outline-none transition-all duration-[--t] focus:border-clay focus:shadow-[0_0_0_3px_rgba(196,101,74,0.12)] placeholder:text-text-light"
            />
            <button className="h-12 px-6.5 bg-clay-deep text-white text-[0.88rem] font-bold rounded-full whitespace-nowrap transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:-translate-y-0.5">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
