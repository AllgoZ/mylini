'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Heart, Award, Sparkles, Smile } from 'lucide-react';

export default function AboutPage() {
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

  const values = [
    {
      icon: <Heart className="text-clay w-6 h-6" />,
      title: 'Comfort First',
      desc: 'All our silk dresses are crafted with pre-washed pure cotton lining, offering 100% scratch-free, all-day festive comfort.',
    },
    {
      icon: <Award className="text-clay w-6 h-6" />,
      title: 'Heritage Weaving',
      desc: 'We source authentic Kanchipuram, Banarasi, and Mysore silk, supporting master weavers keeping ancient craft traditions alive.',
    },
    {
      icon: <Sparkles className="text-clay w-6 h-6" />,
      title: 'Meticulous Detailing',
      desc: 'From custom handmade zari patterns to premium fabric-covered back buttons, no detail is too small for our design team.',
    },
    {
      icon: <Smile className="text-clay w-6 h-6" />,
      title: 'Joyful Childhoods',
      desc: 'Our designs are breathable and movement-friendly, so children can run, dance, and play freely through every celebration.',
    },
  ];

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
            Our Journey & Philosophy
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-head text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6"
          >
            From a Mother's Heart<br />
            <em className="italic text-clay-deep not-italic font-normal">to a Luxury Boutique</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-text-mid text-[0.98rem] leading-[1.7]"
          >
            Mylini is a premium Indian ethnic wear brand specializing in handcrafted Pattupavadai, silk frocks, and traditional outfits for girls and boys, born out of love, heritage, and the pursuit of ultimate comfort.
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
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80"
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
              Rooted in Tradition,<br />Designed for Joy
            </motion.h2>
            <motion.p variants={itemVariants} className="text-text-mid text-[0.95rem] leading-[1.7]">
              As parents, we love the visual richness of traditional fabrics—the shimmering zari work, the deep vibrant jewel tones, the geometric precision of classic borders. But all too often, kids traditional wear is heavy, scratchy, and uncomfortable.
            </motion.p>
            <motion.p variants={itemVariants} className="text-text-mid text-[0.95rem] leading-[1.7]">
              We set out to change that. Mylini fuses India’s rich textile heritage with meticulous garment engineering. Each piece is constructed with <strong>pre-washed premium silks</strong> and lined with a signature, highly breathable 100% pre-washed cotton underskirt to ensure scratch-free, all-day festive play.
            </motion.p>

            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border-soft mt-2">
              <div className="text-center">
                <span className="font-head text-2xl font-bold text-clay-deep">10K+</span>
                <p className="text-[0.72rem] text-text-light font-semibold uppercase tracking-wider mt-1">Families</p>
              </div>
              <div className="text-center border-l border-r border-border-soft">
                <span className="font-head text-2xl font-bold text-clay-deep">100%</span>
                <p className="text-[0.72rem] text-text-light font-semibold uppercase tracking-wider mt-1">Cotton Lined</p>
              </div>
              <div className="text-center">
                <span className="font-head text-2xl font-bold text-clay-deep">5.0 ★</span>
                <p className="text-[0.72rem] text-text-light font-semibold uppercase tracking-wider mt-1">Avg Rating</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="bg-canvas-warm py-20 border-t border-b border-border-soft">
        <div className="w-full mx-auto px-4 md:px-8 lg:px-12 max-w-7xl">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <h2 className="font-head text-3xl font-bold text-ink mb-4">The Pillars of Mylini</h2>
            <p className="text-text-mid text-[0.9rem]">Every outfit is designed based on four uncompromising principles that guide our craft.</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((val, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white rounded-2xl p-6 border border-border-soft shadow-s1 flex flex-col items-start gap-4 hover:shadow-s2 transition-shadow"
              >
                <div className="w-12 h-12 bg-rose-blush rounded-xl flex items-center justify-center">
                  {val.icon}
                </div>
                <h3 className="font-head text-[1.1rem] font-bold text-ink">{val.title}</h3>
                <p className="text-[0.82rem] text-text-mid leading-[1.6]">{val.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Storyteller Call to Action */}
      <section className="py-20 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="font-head text-3xl font-bold text-ink mb-4">Discover the Collection</h2>
          <p className="text-text-mid text-[0.92rem] mb-8 leading-[1.6]">
            Dress your little ones in traditional heritage crafted with infinite love and comfort for your next grand celebration.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/shop/girls" className="bg-clay-deep text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-s2 hover:bg-clay hover:scale-[1.01] transition-all">
              Shop Girls
            </Link>
            <Link href="/shop/boys" className="border-[1.5px] border-border text-ink bg-white px-8 py-3.5 rounded-full text-sm font-bold shadow-s1 hover:border-clay-soft hover:text-clay hover:scale-[1.01] transition-all">
              Shop Boys
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
