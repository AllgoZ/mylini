import { createClient } from '@/lib/db/server'
import { createAdminClient } from '@/lib/db/admin'
import { createPublicClient } from '@/lib/db/publicClient'
import { NotFoundError } from '@/lib/utils/errors'
import type { ProductFilters, ProductFilterMetadata, PaginatedProducts, ProductListItem, ProductWithVariants, VariantSnapshot, ProductImage } from '@/types/product'
import type { Database } from '@/lib/db/generated/database.types'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']
type VariantInsert = Database['public']['Tables']['product_variants']['Insert']
type VariantUpdate = Database['public']['Tables']['product_variants']['Update']
type ImageInsert = Omit<Database['public']['Tables']['product_images']['Insert'], 'id' | 'created_at'>

const LIST_SELECT_INNER = `
  id, name, slug, base_price, sale_price,
  is_featured, is_best_seller, is_new_arrival, status,
  product_type, tags,
  category:categories!inner(id, name, slug),
  images:product_images(public_url, is_primary, sort_order)
`

const LIST_SELECT_LEFT = `
  id, name, slug, base_price, sale_price,
  is_featured, is_best_seller, is_new_arrival, status,
  product_type, tags,
  category:categories(id, name, slug),
  images:product_images(public_url, is_primary, sort_order)
`

// Used only by findBySlug (the customer-facing product page). Explicit columns instead of
// `*` — excludes meta_title/meta_description/og_image/canonical_url/search_vector, none of
// which ProductDetailClient reads (search_vector in particular is a TSVECTOR, dead weight
// on every product-page load). findByIdForAdmin keeps `*` via DETAIL_SELECT_LEFT below.
const DETAIL_SELECT_INNER = `
  id, category_id, name, slug, description, status, base_price, sale_price,
  is_featured, is_best_seller, is_new_arrival,
  created_at, updated_at, deleted_at,
  weight_grams, length_cm, width_cm, height_cm, size_chart_url,
  product_type, tags, charge_tax,
  category:categories!inner(id, name, slug),
  variants:product_variants(
    *,
    inventory(stock_available, stock_reserved, low_stock_threshold, inventory_tracked, sell_when_out_of_stock)
  ),
  images:product_images(*),
  attributes:product_attributes(*)
`

const DETAIL_SELECT_LEFT = `
  *,
  category:categories(id, name, slug),
  variants:product_variants(
    *,
    inventory(stock_available, stock_reserved, low_stock_threshold, inventory_tracked, sell_when_out_of_stock)
  ),
  images:product_images(*),
  attributes:product_attributes(*)
`

export const ProductRepository = {
  async findAll(filters: ProductFilters): Promise<PaginatedProducts> {
    const supabase = createPublicClient()
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    const selectClause = filters.category ? LIST_SELECT_INNER : LIST_SELECT_LEFT
    let query = supabase
      .from('products')
      .select(selectClause, { count: 'exact' })
      .is('deleted_at', null)
      .eq('status', (filters.status ?? 'active') as any)
      .is('categories.deleted_at', null)
      .range(from, to)

    if (filters.category) {
      query = query.eq('categories.slug', filters.category)
    }
    if (filters.featured) query = query.eq('is_featured', true)
    if (filters.bestSeller) query = query.eq('is_best_seller', true)
    if (filters.newArrival) query = query.eq('is_new_arrival', true)

    if (filters.price_min != null) query = query.gte('base_price', filters.price_min)
    if (filters.price_max != null) query = query.lte('base_price', filters.price_max)
    if (filters.product_type) query = (query as any).eq('product_type', filters.product_type)
    if (filters.tag) query = (query as any).contains('tags', [filters.tag])

    // Resolve size filter via parallel variant lookup so it doesn't block the main query chain
    if (filters.exclude) {
      query = query.neq('id', filters.exclude)
    }

    if (filters.size) {
      const { data: vData } = await supabase
        .from('product_variants')
        .select('product_id')
        .eq('size', filters.size)
        .eq('is_active', true)
        .is('deleted_at', null)
      const ids = [...new Set((vData ?? []).map((v: any) => v.product_id as string))]
      if (ids.length === 0) return { items: [], count: 0, page, limit, totalPages: 0 }
      query = query.in('id', ids)
    }

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

    const items = (data ?? []).map((p: any) => {
      const sorted: { public_url: string; sort_order: number; is_primary: boolean }[] =
        (p.images ?? []).slice().sort((a: any, b: any) => {
          if (b.is_primary !== a.is_primary) return b.is_primary ? 1 : -1
          return (a.sort_order ?? 0) - (b.sort_order ?? 0)
        })
      return { ...p, primary_image: sorted[0]?.public_url ?? null }
    }) as ProductListItem[]

    return {
      items,
      count: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  },

  async findBySlug(slug: string): Promise<ProductWithVariants> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('products')
      .select(DETAIL_SELECT_INNER)
      .eq('slug', slug)
      .eq('status', 'active')
      .is('deleted_at', null)
      .is('categories.deleted_at', null)
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

  async getFilterMetadata(category?: string): Promise<ProductFilterMetadata> {
    const supabase = createPublicClient()

    // Products in this category (active, not deleted)
    let productIdQuery = supabase
      .from('products')
      .select('id, base_price, product_type, tags, categories:categories!inner(slug)')
      .eq('status', 'active')
      .is('deleted_at', null)
    if (category) productIdQuery = (productIdQuery as any).eq('categories.slug', category)
    const { data: productData } = await productIdQuery

    const productIds = (productData ?? []).map((p: any) => p.id)
    const prices = (productData ?? []).map((p: any) => p.base_price as number)
    const productTypes = [...new Set(
      (productData ?? []).map((p: any) => p.product_type as string | null).filter(Boolean)
    )] as string[]
    const tags = [...new Set(
      (productData ?? []).flatMap((p: any) => (p.tags as string[]) ?? []).filter(Boolean)
    )].sort() as string[]

    // Sizes from active variants of these products
    let sizes: string[] = []
    if (productIds.length > 0) {
      const { data: variantData } = await supabase
        .from('product_variants')
        .select('size')
        .in('product_id', productIds)
        .eq('is_active', true)
        .not('size', 'is', null)
      sizes = [...new Set((variantData ?? []).map((v: any) => v.size as string))].sort()
    }

    // Category navigation: children (if parent) or siblings + parent link (if leaf)
    let subcategories: { name: string; slug: string }[] = []
    let parent_category: { name: string; slug: string } | null = null

    if (category) {
      const { data: catRow } = await supabase
        .from('categories')
        .select('id, parent_id, name, slug')
        .eq('slug', category)
        .is('deleted_at', null)
        .maybeSingle()

      if (catRow) {
        // Check for children first
        const { data: children } = await supabase
          .from('categories')
          .select('name, slug')
          .eq('parent_id', (catRow as any).id)
          .is('deleted_at', null)
          .order('name')

        if ((children?.length ?? 0) > 0) {
          subcategories = (children ?? []).map((c: any) => ({ name: c.name, slug: c.slug }))
        } else if ((catRow as any).parent_id) {
          // Leaf category — get parent + siblings
          const [parentRes, siblingRes] = await Promise.all([
            supabase
              .from('categories')
              .select('name, slug')
              .eq('id', (catRow as any).parent_id)
              .maybeSingle(),
            supabase
              .from('categories')
              .select('name, slug')
              .eq('parent_id', (catRow as any).parent_id)
              .is('deleted_at', null)
              .neq('id', (catRow as any).id)
              .order('name'),
          ])
          if (parentRes.data) {
            parent_category = { name: (parentRes.data as any).name, slug: (parentRes.data as any).slug }
          }
          subcategories = (siblingRes.data ?? []).map((c: any) => ({ name: c.name, slug: c.slug }))
        }
      }
    }

    return {
      sizes,
      product_types: productTypes.sort(),
      tags,
      subcategories,
      parent_category,
      price_min: prices.length ? Math.floor(Math.min(...prices)) : 0,
      price_max: prices.length ? Math.ceil(Math.max(...prices)) : 10000,
    }
  },

  // ─── Admin methods ───────────────────────────────────────────────────────────

  async findAllForAdmin(filters: { search?: string; status?: string; category?: string; page?: number; limit?: number }): Promise<PaginatedProducts> {
    const supabase = createAdminClient()
    const page = filters.page ?? 1
    const limit = filters.limit ?? 30
    const from = (page - 1) * limit

    const selectClause = filters.category ? LIST_SELECT_INNER : LIST_SELECT_LEFT
    let query = supabase
      .from('products')
      .select(selectClause, { count: 'exact' })
      .is('deleted_at', null)
      .is('categories.deleted_at', null)
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (filters.status) query = query.eq('status', filters.status as any)
    if (filters.category) query = (query as any).eq('categories.slug', filters.category)
    if (filters.search) query = query.textSearch('search_vector', filters.search, { type: 'plain' })

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const items = (data ?? []).map((p: any) => {
      const sorted: { public_url: string; sort_order: number; is_primary: boolean }[] =
        (p.images ?? []).slice().sort((a: any, b: any) => {
          if (b.is_primary !== a.is_primary) return b.is_primary ? 1 : -1
          return (a.sort_order ?? 0) - (b.sort_order ?? 0)
        })
      return { ...p, primary_image: sorted[0]?.public_url ?? null }
    }) as ProductListItem[]

    return { items, count: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) }
  },

  async findByIdForAdmin(id: string): Promise<ProductWithVariants> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select(DETAIL_SELECT_LEFT)
      .eq('id', id)
      .is('deleted_at', null)
      .is('categories.deleted_at', null)
      .single()

    if (error || !data) throw new NotFoundError(`Product '${id}'`)
    return data as unknown as ProductWithVariants
  },

  async slugExists(slug: string): Promise<boolean> {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle()
    return !!data
  },

  async create(data: ProductInsert): Promise<{ id: string; slug: string }> {
    const supabase = createAdminClient()
    const { data: product, error } = await supabase
      .from('products')
      .insert(data as any)
      .select('id, slug')
      .single()

    if (error) throw new Error(error.message)
    return product
  },

  async update(id: string, data: ProductUpdate): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('products')
      .update({ ...data, updated_at: new Date().toISOString() } as any)
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async softDelete(id: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from('products')
      .update({ deleted_at: new Date().toISOString(), status: 'archived' })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async createVariant(data: VariantInsert & { initial_stock?: number }): Promise<{ id: string }> {
    const supabase = createAdminClient()
    const { initial_stock = 0, ...variantData } = data as any
    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert(variantData as any)
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    // Initialize inventory row with the provided stock quantity
    const { error: invError } = await supabase
      .from('inventory')
      .insert({ variant_id: variant.id, stock_available: initial_stock, stock_reserved: 0, low_stock_threshold: 2 } as any)
    if (invError && !invError.message.includes('duplicate')) throw new Error(invError.message)

    return variant
  },

  async updateVariant(variantId: string, data: VariantUpdate): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('product_variants')
      .update({ ...data, updated_at: new Date().toISOString() } as any)
      .eq('id', variantId)

    if (error) throw new Error(error.message)
  },

  async softDeleteVariant(variantId: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from('product_variants')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', variantId)

    if (error) throw new Error(error.message)
  },

  async addImage(data: ImageInsert): Promise<ProductImage> {
    const supabase = createAdminClient()
    const { data: created, error } = await supabase
      .from('product_images')
      .insert(data as any)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return created as unknown as ProductImage
  },

  async findImageById(imageId: string): Promise<{ storage_key: string; storage_provider: string } | null> {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('product_images')
      .select('storage_key, storage_provider')
      .eq('id', imageId)
      .single()
    return data as { storage_key: string; storage_provider: string } | null
  },

  async removeImage(imageId: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase.from('product_images').delete().eq('id', imageId)
    if (error) throw new Error(error.message)
  },

  async updateImage(imageId: string, data: { sort_order?: number; is_primary?: boolean; alt_text?: string }): Promise<void> {
    const supabase = createAdminClient()
    // If setting as primary, clear other primaries for this product first
    if (data.is_primary) {
      const { data: img } = await supabase.from('product_images').select('product_id').eq('id', imageId).single()
      if (img) {
        await (supabase as any).from('product_images').update({ is_primary: false }).eq('product_id', img.product_id)
      }
    }
    const { error } = await supabase.from('product_images').update(data as any).eq('id', imageId)
    if (error) throw new Error(error.message)
  },

  async replaceAttributes(productId: string, attributes: { key: string; value: string }[]): Promise<void> {
    const supabase = createAdminClient()
    const { error: delError } = await supabase.from('product_attributes').delete().eq('product_id', productId)
    if (delError) throw new Error(delError.message)
    if (attributes.length === 0) return
    const rows = attributes.map(a => ({ product_id: productId, key: a.key, value: a.value }))
    const { error } = await supabase.from('product_attributes').insert(rows as any)
    if (error) throw new Error(error.message)
  },

  async deleteAttribute(attributeId: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase.from('product_attributes').delete().eq('id', attributeId)
    if (error) throw new Error(error.message)
  },

  // ─── End admin methods ────────────────────────────────────────────────────────

  async findVariantsByIds(variantIds: string[]): Promise<VariantSnapshot[]> {
    const supabase = await createClient()
    // Images are attached to the product (product_images.product_id), not the variant —
    // product_images.variant_id exists in the schema but is never populated by the admin
    // panel. Same fix as cartRepository.ts's product join.
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        id, sku, color, size, price_override,
        product:products!inner(name, base_price, sale_price, images:product_images(public_url, is_primary))
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
      image: v.product.images?.find((i: any) => i.is_primary)?.public_url ?? v.product.images?.[0]?.public_url ?? null,
    }))
  },
}
