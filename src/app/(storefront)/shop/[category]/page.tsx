export const dynamic = 'force-dynamic';

import { ProductGridClient } from './ProductGridClient';
import { getProducts } from '@/lib/api/products';
import { adaptProductListItem } from '@/lib/utils/adapters';

export default async function ShopCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params;
  const categoryName = category.replace(/-/g, ' ');

  const data = await getProducts({ category, limit: 40 }).catch(() => null);
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

      <ProductGridClient initialProducts={products} />
    </div>
  );
}
