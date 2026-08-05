'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, Award, Sparkles, Smile, Star, Shield, Truck, Gift, Sun, Users, Leaf, Crown,
} from 'lucide-react';
import type { AboutPageContent } from '@/types/about';

// Keyed by the `icon` string stored per value in about_page_content.values — a plain
// string round-trips through JSON (DB, API, admin form) far more simply than a
// component reference would. Add here whenever a new option is added to the admin
// icon picker (admin/about/page.tsx).
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  award: Award,
  sparkles: Sparkles,
  smile: Smile,
  star: Star,
  shield: Shield,
  truck: Truck,
  gift: Gift,
  sun: Sun,
  users: Users,
  leaf: Leaf,
  crown: Crown,
};

interface Props {
  content: AboutPageContent;
}

export default function AboutPageClient({ content }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-canvas" />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  };

  const [stat1, stat2, stat3] = content.stats;

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Editorial Header */}
      <section className="bg-surface py-20 border-b border-border-soft">
        <div className="w-full mx-auto px-4 md:px-8 lg:px-12 text-center max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[0.72rem] font-bold tracking-[0.15em] uppercase text-clay mb-3"
          >
            {content.eyebrow_text}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-head text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6"
          >
            {content.heading_line1}<br />
            <em className="italic text-clay-deep not-italic font-normal">{content.heading_line2}</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-text-mid text-[0.98rem] leading-[1.7]"
          >
            {content.intro_text}
          </motion.p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="w-full mx-auto px-4 md:px-8 lg:px-12 py-16 lg:py-24 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-s3 border border-border-soft"
          >
            <Image
              src={content.narrative_image_url}
              alt="Mylini Craftsmanship & Traditional Wear"
              fill
              className="object-cover"
            />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <motion.h2 variants={itemVariants} className="font-head text-3xl font-bold text-ink tracking-tight">
              {content.narrative_heading_line1}<br />{content.narrative_heading_line2}
            </motion.h2>
            <motion.p variants={itemVariants} className="text-text-mid text-[0.95rem] leading-[1.7]">
              {content.narrative_paragraph1}
            </motion.p>
            <motion.p variants={itemVariants} className="text-text-mid text-[0.95rem] leading-[1.7]">
              {content.narrative_paragraph2}
            </motion.p>

            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border-soft mt-2">
              <div className="text-center">
                <span className="font-head text-2xl font-bold text-clay-deep">{stat1?.value}</span>
                <p className="text-[0.72rem] text-text-light font-semibold uppercase tracking-wider mt-1">{stat1?.label}</p>
              </div>
              <div className="text-center border-l border-r border-border-soft">
                <span className="font-head text-2xl font-bold text-clay-deep">{stat2?.value}</span>
                <p className="text-[0.72rem] text-text-light font-semibold uppercase tracking-wider mt-1">{stat2?.label}</p>
              </div>
              <div className="text-center">
                <span className="font-head text-2xl font-bold text-clay-deep">{stat3?.value}</span>
                <p className="text-[0.72rem] text-text-light font-semibold uppercase tracking-wider mt-1">{stat3?.label}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="bg-canvas-warm py-20 border-t border-b border-border-soft">
        <div className="w-full mx-auto px-4 md:px-8 lg:px-12 max-w-7xl">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <h2 className="font-head text-3xl font-bold text-ink mb-4">{content.values_heading}</h2>
            <p className="text-text-mid text-[0.9rem]">{content.values_subtitle}</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {content.values.map((val, idx) => {
              const Icon = ICON_MAP[val.icon] ?? Heart;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="bg-white rounded-2xl p-6 border border-border-soft shadow-s1 flex flex-col items-start gap-4 hover:shadow-s2 transition-shadow"
                >
                  <div className="w-12 h-12 bg-rose-blush rounded-xl flex items-center justify-center">
                    <Icon className="text-clay w-6 h-6" />
                  </div>
                  <h3 className="font-head text-[1.1rem] font-bold text-ink">{val.title}</h3>
                  <p className="text-[0.82rem] text-text-mid leading-[1.6]">{val.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Storyteller Call to Action */}
      <section className="py-20 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="font-head text-3xl font-bold text-ink mb-4">{content.cta_heading}</h2>
          <p className="text-text-mid text-[0.92rem] mb-8 leading-[1.6]">
            {content.cta_text}
          </p>
          <div className="flex justify-center gap-4">
            <Link href={content.cta_button1_link} className="bg-clay-deep text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-s2 hover:bg-clay hover:scale-[1.01] transition-all">
              {content.cta_button1_text}
            </Link>
            <Link href={content.cta_button2_link} className="border-[1.5px] border-border text-ink bg-white px-8 py-3.5 rounded-full text-sm font-bold shadow-s1 hover:border-clay-soft hover:text-clay hover:scale-[1.01] transition-all">
              {content.cta_button2_text}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
