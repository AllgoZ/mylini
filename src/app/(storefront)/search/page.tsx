// Same ISR posture as shop/[category]/page.tsx — reading searchParams makes this render
// dynamically per query regardless of `revalidate`, an existing, accepted pattern in
// this codebase (see the ISR investigation notes for that page).
export const revalidate = 60;

import { ProductCard } from '@/components/shop/ProductCard';
import { ProductService } from '@/lib/services/productService';
import { adaptProductListItem } from '@/lib/utils/adapters';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const data = query ? await ProductService.list({ search: query, limit: 40 }).catch(() => null) : null;
  const products = (data?.items ?? []).map(adaptProductListItem);

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <div className="bg-surface py-10 border-b border-border-soft">
        <div className="w-full mx-auto px-4 md:px-8 lg:px-12 text-center">
          <h1 className="font-head text-2xl md:text-3xl font-bold text-ink mb-2">
            {query ? `Results for "${query}"` : 'Search'}
          </h1>
          {query && (
            <p className="text-text-mid text-[0.9rem]">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </div>

      <div className="w-full mx-auto px-4 md:px-8 lg:px-12 py-8">
        {!query ? (
          <p className="text-center text-text-mid py-16">Enter a search term to find products.</p>
        ) : products.length === 0 ? (
          <p className="text-center text-text-mid py-16">No products found for &quot;{query}&quot;. Try a different search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} delay={i * 0.03} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
