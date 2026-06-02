export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/api/products';
import { ProductDetailClient } from './ProductDetailClient';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
