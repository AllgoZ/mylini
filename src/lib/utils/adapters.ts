import type { ProductListItem, ProductSummary } from '@/types/product'

export function adaptProductListItem(p: ProductListItem): ProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.sale_price ?? p.base_price,
    oldPrice: p.sale_price ? p.base_price : undefined,
    image: p.primary_image ?? '',
    images: p.primary_image ? [p.primary_image] : [],
    isNew: p.is_new_arrival,
    discountBadge: p.is_new_arrival ? 'New' : p.is_best_seller ? 'Hot' : undefined,
  }
}
