export const revalidate = 60;

import { notFound } from 'next/navigation';
import { ProductService } from '@/lib/services/productService';
import { ProductDetailClient } from './ProductDetailClient';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;

  let product;
  try {
    product = await ProductService.getBySlug(slug);
  } catch {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
