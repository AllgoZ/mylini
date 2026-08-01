'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Paintbrush, Scissors, Leaf, Sparkles } from 'lucide-react';

export function StorySection() {
  return (
    <div className="bg-ink mt-14 overflow-hidden">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 min-h-[480px]">
        
        {/* Visual Half */}
        <div className="bg-gradient-to-br from-[#2F0B23] via-[#3E0F2F] to-[#77440F] flex items-center justify-center relative overflow-hidden min-h-[260px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(212,169,100,0.18),transparent_60%)]" />
          
          <div className="absolute -bottom-2 left-5 font-head text-[clamp(5rem,10vw,9rem)] font-bold text-white/[0.06] leading-none select-none">
            8
          </div>
          
          <div className="relative z-10 flex flex-col gap-3 p-10 md:p-12 w-full max-w-[400px]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 border border-white/15 rounded-[22px] p-4 px-5.5 backdrop-blur-md"
            >
              <div className="font-head text-[1.9rem] font-bold text-gold-pale">12,000+</div>
              <div className="text-[0.78rem] text-white/60 mt-0.5">Happy families served</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/10 border border-white/15 rounded-[22px] p-4 px-5.5 backdrop-blur-md self-end"
            >
              <div className="font-head text-[1.9rem] font-bold text-gold-pale">500+</div>
              <div className="text-[0.78rem] text-white/60 mt-0.5">Handcrafted designs</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/10 border border-white/15 rounded-[22px] p-4 px-5.5 backdrop-blur-md"
            >
              <div className="font-head text-[1.9rem] font-bold text-gold-pale">4.9 ★</div>
              <div className="text-[0.78rem] text-white/60 mt-0.5">Average customer rating</div>
            </motion.div>
          </div>
        </div>

        {/* Text Half */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="p-11 md:p-14 md:pl-12 flex flex-col justify-center"
        >
          <div className="text-[0.7rem] font-bold tracking-[0.18em] uppercase text-clay-soft mb-4">
            Our Story
          </div>
          <h2 className="font-head text-[clamp(1.7rem,2.8vw,2.4rem)] font-bold text-white leading-[1.2] mb-5">
            From a Mother's Heart<br />
            & a <em className="italic text-gold-pale">Designer's Vision</em>
          </h2>
          <p className="text-[0.95rem] leading-[1.8] text-white/60 mb-8">
            At Mylini, every outfit is crafted with a mother's care and a designer's vision. Blending comfort, elegance, and timeless style, we create thoughtfully designed clothing for your little ones and their most cherished moments.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-9">
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-sm bg-[rgba(138,90,110,0.3)] flex items-center justify-center shrink-0 text-clay-soft">
                <Paintbrush size={16} />
              </div>
              <div className="text-[0.82rem] text-white/65 leading-[1.5]">
                <strong className="text-white block text-[0.85rem] mb-[1px]">Thoughtful Crafting</strong>
                Hand-stitched by skilled artisans in Tamil Nadu
              </div>
            </div>
            
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-sm bg-[rgba(138,90,110,0.3)] flex items-center justify-center shrink-0 text-clay-soft">
                <Scissors size={16} />
              </div>
              <div className="text-[0.82rem] text-white/65 leading-[1.5]">
                <strong className="text-white block text-[0.85rem] mb-[1px]">Premium Fabrics</strong>
                Only the finest silks & cottons, sourced ethically
              </div>
            </div>
            
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-sm bg-[rgba(138,90,110,0.3)] flex items-center justify-center shrink-0 text-clay-soft">
                <Leaf size={16} />
              </div>
              <div className="text-[0.82rem] text-white/65 leading-[1.5]">
                <strong className="text-white block text-[0.85rem] mb-[1px]">Sustainable</strong>
                Supporting 15+ artisan families with fair trade
              </div>
            </div>
            
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-sm bg-[rgba(138,90,110,0.3)] flex items-center justify-center shrink-0 text-clay-soft">
                <Sparkles size={16} />
              </div>
              <div className="text-[0.82rem] text-white/65 leading-[1.5]">
                <strong className="text-white block text-[0.85rem] mb-[1px]">Seasonless Style</strong>
                Designed to be treasured & worn again and again
              </div>
            </div>
          </div>
          
          <Link
            href="/about"
            className="inline-flex items-center gap-2 w-fit bg-clay text-white text-[0.88rem] font-bold py-[13px] px-[26px] rounded-full transition-all duration-[--t] ease-[--spring] hover:bg-clay-soft hover:-translate-y-0.5"
          >
            Discover Our Journey <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
