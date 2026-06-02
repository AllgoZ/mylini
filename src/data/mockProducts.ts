import type { ProductSummary } from '@/types/product';

// These mock entries are kept only as a temporary fallback during Phase 3B migration.
// They will be deleted once all pages use the live API.

export const bestSellers: ProductSummary[] = [
  { id: 'p1', slug: 'p1', name: 'Ivory & Pistachio Girls Pattupavadai Set', price: 2249, oldPrice: 2499, image: '/products/product2/Ivory_Pistachio_Girls_Pattupavadai_Set_2249.webp', images: ['/products/product2/Ivory_Pistachio_Girls_Pattupavadai_Set_2249.webp'] },
  { id: 'p2', slug: 'p2', name: 'Parrot Green & Maroon Mysore Silk Baby Frock', price: 1159, oldPrice: 1299, image: '/products/product1/16.webp', images: ['/products/product1/16.webp'] },
  { id: 'p3', slug: 'p3', name: 'Teal & Mustard Baby Traditional Dress', price: 1159, oldPrice: 1299, image: '/products/product1/19.webp', images: ['/products/product1/19.webp'], isNew: true, discountBadge: 'New' },
  { id: 'p4', slug: 'p4', name: 'Semi Silk Pattupavadai — Teal Blue & Royal Purple', price: 2499, oldPrice: 2620, image: '/products/product1/20.webp', images: ['/products/product1/20.webp'] },
];

export const newArrivals: ProductSummary[] = [
  { id: 'n1', slug: 'n1', name: 'Royal Purple Banarasi Dress', price: 1829, oldPrice: 2030, image: '/products/product4/Purple_and_gold_mysore_silk.webp', isNew: true, discountBadge: 'New' },
  { id: 'n2', slug: 'n2', name: 'Red & Emerald Green Girls Pattupavadai Set', price: 3399, oldPrice: 3799, image: '/products/product5/Red_Emerald_Green_Girls_Pattupavadai_Set_3399.webp', isNew: true, discountBadge: 'New' },
  { id: 'n3', slug: 'n3', name: 'Mint Floral Boys Traditional Shirt', price: 1375, image: '/products/product3/Mustard_Fuchsia_Girls_Traditional_Set_1.webp', isNew: true, discountBadge: 'New' },
  { id: 'n4', slug: 'n4', name: 'Cream & Mustard Girls Pattupavadai Set', price: 2059, oldPrice: 2299, image: '/products/product3/84.webp', isNew: true, discountBadge: 'New' },
];
