import type { ProductListItem, ProductSummary } from '@/types/product'

export function adaptProductListItem(p: ProductListItem): ProductSummary {
  const allImages = (p as any).images as Array<{ public_url: string; sort_order: number }> | undefined
  const sortedImages = allImages
    ?.sort((a, b) => a.sort_order - b.sort_order)
    .map(i => i.public_url)
    .filter(Boolean) as string[] | undefined

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.sale_price ?? p.base_price,
    oldPrice: p.sale_price ? p.base_price : undefined,
    image: p.primary_image ?? '',
    images: sortedImages?.length ? sortedImages : (p.primary_image ? [p.primary_image] : []),
    isNew: p.is_new_arrival,
    discountBadge: p.is_new_arrival ? 'New' : p.is_best_seller ? 'Hot' : undefined,
  }
}
