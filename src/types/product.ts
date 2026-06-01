import type { Database } from '@/lib/db/generated/database.types'

export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type ProductAttribute = Database['public']['Tables']['product_attributes']['Row']

export type ProductStatus = Database['public']['Enums']['product_status']

export type ProductWithVariants = Product & {
  category: Pick<Category, 'id' | 'name' | 'slug'>
  variants: (ProductVariant & {
    inventory: {
      stock_available: number
      stock_reserved: number
      low_stock_threshold: number
    } | null
  })[]
  images: ProductImage[]
  attributes: ProductAttribute[]
}

export type ProductListItem = Pick<
  Product,
  'id' | 'name' | 'slug' | 'base_price' | 'sale_price' | 'is_featured' | 'is_best_seller' | 'is_new_arrival' | 'status'
> & {
  primary_image: string | null
  category: Pick<Category, 'id' | 'name' | 'slug'>
}

// Lightweight shape used by Zustand wishlist store
export type ProductSummary = {
  id: string
  name: string
  price: number
  oldPrice?: number
  image: string
  images?: string[]
  isNew?: boolean
  discountBadge?: string
  rating?: number
  reviews?: number
}

export type ProductFilters = {
  category?: string
  search?: string
  status?: ProductStatus
  featured?: boolean
  bestSeller?: boolean
  newArrival?: boolean
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular'
  page?: number
  limit?: number
}

export type PaginatedProducts = {
  items: ProductListItem[]
  count: number
  page: number
  limit: number
  totalPages: number
}

// Used by ProductRepository.findVariantsByIds() and OrderService for order snapshots
export type VariantSnapshot = {
  id: string
  sku: string
  color: string | null
  size: string | null
  price: number
  productName: string
  image: string | null
}
