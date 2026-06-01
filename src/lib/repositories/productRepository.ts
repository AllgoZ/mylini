import { createClient } from '@/lib/db/server'
import { NotFoundError } from '@/lib/utils/errors'
import type { ProductFilters, PaginatedProducts, ProductListItem, ProductWithVariants, VariantSnapshot } from '@/types/product'

const LIST_SELECT = `
  id, name, slug, base_price, sale_price,
  is_featured, is_best_seller, is_new_arrival, status,
  category:categories!inner(id, name, slug),
  images:product_images(public_url, is_primary, sort_order)
`

const DETAIL_SELECT = `
  *,
  category:categories!inner(id, name, slug),
  variants:product_variants(
    *,
    inventory(stock_available, stock_reserved, low_stock_threshold)
  ),
  images:product_images(*),
  attributes:product_attributes(*)
`

export const ProductRepository = {
  async findAll(filters: ProductFilters): Promise<PaginatedProducts> {
    const supabase = await createClient()
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('products')
      .select(LIST_SELECT, { count: 'exact' })
      .is('deleted_at', null)
      .eq('status', filters.status ?? 'active')
      .range(from, to)

    if (filters.category) {
      query = query.eq('categories.slug', filters.category)
    }
    if (filters.featured) query = query.eq('is_featured', true)
    if (filters.bestSeller) query = query.eq('is_best_seller', true)
    if (filters.newArrival) query = query.eq('is_new_arrival', true)

    if (filters.search) {
      query = query.textSearch('search_vector', filters.search, { type: 'plain' })
    }

    switch (filters.sort) {
      case 'price_asc':  query = query.order('base_price', { ascending: true }); break
      case 'price_desc': query = query.order('base_price', { ascending: false }); break
      case 'popular':    query = query.order('is_best_seller', { ascending: false }); break
      default:           query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    const items = (data ?? []).map((p: any) => ({
      ...p,
      primary_image: p.images?.find((i: any) => i.is_primary)?.public_url ?? p.images?.[0]?.public_url ?? null,
    })) as ProductListItem[]

    return {
      items,
      count: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  },

  async findBySlug(slug: string): Promise<ProductWithVariants> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select(DETAIL_SELECT)
      .eq('slug', slug)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single()

    if (error || !data) throw new NotFoundError(`Product '${slug}'`)
    return data as unknown as ProductWithVariants
  },

  async findFeatured(limit = 8): Promise<ProductListItem[]> {
    const { items } = await this.findAll({ featured: true, limit })
    return items
  },

  async findBestSellers(limit = 8): Promise<ProductListItem[]> {
    const { items } = await this.findAll({ bestSeller: true, limit })
    return items
  },

  async findNewArrivals(limit = 8): Promise<ProductListItem[]> {
    const { items } = await this.findAll({ newArrival: true, limit })
    return items
  },

  async search(query: string, limit = 20): Promise<ProductListItem[]> {
    const { items } = await this.findAll({ search: query, limit })
    return items
  },

  async findVariantsByIds(variantIds: string[]): Promise<VariantSnapshot[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        id, sku, color, size, price_override,
        product:products!inner(name, base_price, sale_price),
        images:product_images(public_url, is_primary)
      `)
      .in('id', variantIds)

    if (error) throw new Error(error.message)

    return (data ?? []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      color: v.color,
      size: v.size,
      price: v.price_override ?? v.product.sale_price ?? v.product.base_price,
      productName: v.product.name,
      image: v.images?.find((i: any) => i.is_primary)?.public_url ?? v.images?.[0]?.public_url ?? null,
    }))
  },
}
