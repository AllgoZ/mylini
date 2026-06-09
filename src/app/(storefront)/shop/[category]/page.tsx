// Cache shop pages for 60 s; revalidate on next request after expiry (ISR)
export const revalidate = 60;

import { ProductGridClient } from './ProductGridClient';
import { ProductService } from '@/lib/services/productService';
import { adaptProductListItem } from '@/lib/utils/adapters';
import type { ProductFilters } from '@/types/product';

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { category } = await params;
  const sp = await searchParams;
  const categoryName = category.replace(/-/g, ' ');

  const filters: ProductFilters = {
    category,
    limit: 40,
    size: sp.size || undefined,
    price_min: sp.price_min ? Number(sp.price_min) : undefined,
    price_max: sp.price_max ? Number(sp.price_max) : undefined,
    product_type: sp.product_type || undefined,
    tag: sp.tag || undefined,
    sort: (sp.sort as ProductFilters['sort']) || 'newest',
  };

  const [data, metadata] = await Promise.all([
    ProductService.list(filters).catch(() => null),
    ProductService.getFilterMetadata(category).catch(() => null),
  ]);

  const products = (data?.items ?? []).map(adaptProductListItem);

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Category Header */}
      <div className="bg-surface py-12 border-b border-border-soft">
        <div className="w-full mx-auto px-4 md:px-8 lg:px-12 text-center">
          <h1 className="font-head text-4xl md:text-5xl font-bold text-ink capitalize mb-4">
            {categoryName}
          </h1>
          <p className="text-text-mid text-[0.95rem] max-w-xl mx-auto">
            Discover our beautifully handcrafted {categoryName} collection, made with premium fabrics
            and traditional techniques for your little ones.
          </p>
        </div>
      </div>

      <ProductGridClient
        initialProducts={products}
        filterMetadata={metadata}
        activeFilters={sp}
        category={category}
      />
    </div>
  );
}
