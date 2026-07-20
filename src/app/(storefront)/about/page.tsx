export const revalidate = 60;

import { AboutService } from '@/lib/services/aboutService';
import type { AboutPageContent } from '@/types/about';
import AboutPageClient from './AboutPageClient';

// Mirrors the migration 039 column defaults exactly — if the fetch fails (e.g. the
// migration hasn't been applied yet, matching this project's "no automatic migration
// runner" convention), the page renders exactly what it always has, rather than
// breaking or showing empty content.
const FALLBACK_CONTENT: AboutPageContent = {
  id: 'fallback',
  eyebrow_text: 'Our Journey & Philosophy',
  heading_line1: "From a Mother's Heart",
  heading_line2: 'to a Luxury Boutique',
  intro_text: 'Mylini is a premium Indian ethnic wear brand specializing in handcrafted Pattupavadai, silk frocks, and traditional outfits for girls and boys, born out of love, heritage, and the pursuit of ultimate comfort.',
  narrative_image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
  narrative_heading_line1: 'Rooted in Tradition,',
  narrative_heading_line2: 'Designed for Joy',
  narrative_paragraph1: 'As parents, we love the visual richness of traditional fabrics—the shimmering zari work, the deep vibrant jewel tones, the geometric precision of classic borders. But all too often, kids traditional wear is heavy, scratchy, and uncomfortable.',
  narrative_paragraph2: "We set out to change that. Mylini fuses India's rich textile heritage with meticulous garment engineering. Each piece is constructed with pre-washed premium silks and lined with a signature, highly breathable 100% pre-washed cotton underskirt to ensure scratch-free, all-day festive play.",
  stats: [
    { value: '10K+', label: 'Families' },
    { value: '100%', label: 'Cotton Lined' },
    { value: '5.0 ★', label: 'Avg Rating' },
  ],
  values_heading: 'The Pillars of Mylini',
  values_subtitle: 'Every outfit is designed based on four uncompromising principles that guide our craft.',
  values: [
    { icon: 'heart', title: 'Comfort First', description: 'All our silk dresses are crafted with pre-washed pure cotton lining, offering 100% scratch-free, all-day festive comfort.' },
    { icon: 'award', title: 'Heritage Weaving', description: 'We source authentic Kanchipuram, Banarasi, and Mysore silk, supporting master weavers keeping ancient craft traditions alive.' },
    { icon: 'sparkles', title: 'Meticulous Detailing', description: 'From custom handmade zari patterns to premium fabric-covered back buttons, no detail is too small for our design team.' },
    { icon: 'smile', title: 'Joyful Childhoods', description: 'Our designs are breathable and movement-friendly, so children can run, dance, and play freely through every celebration.' },
  ],
  cta_heading: 'Discover the Collection',
  cta_text: 'Dress your little ones in traditional heritage crafted with infinite love and comfort for your next grand celebration.',
  cta_button1_text: 'Shop Girls',
  cta_button1_link: '/shop/girls',
  cta_button2_text: 'Shop Boys',
  cta_button2_link: '/shop/boys',
  updated_at: '',
};

export default async function AboutPage() {
  const content = await AboutService.get().catch(() => FALLBACK_CONTENT);
  return <AboutPageClient content={content} />;
}
