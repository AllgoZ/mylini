import type { Database } from '@/lib/db/generated/database.types'

export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type ProductAttribute = Database['public']['Tables']['product_attributes']['Row']

export type ProductStatus = Database['public']['Enums']['product_status']

// Extended inventory shape — includes fields from migration 028
export type InventoryRow = {
  stock_available: number
  stock_reserved: number
  low_stock_threshold: number
  inventory_tracked: boolean
  sell_when_out_of_stock: boolean
}

// Extended variant shape — includes fields from migrations 026 + 028
export type VariantWithInventory = ProductVariant & {
  barcode: string | null
  compare_at_price: number | null
  cost_per_item: number | null
  inventory: InventoryRow | null
}

export type ProductWithVariants = Product & {
  // Extended product fields from migrations 026 / 027 / 028
  weight_grams: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  size_chart_url: string | null
  product_type: string | null
  tags: string[]
  charge_tax: boolean
  meta_title: string | null
  meta_description: string | null
  category: Pick<Category, 'id' | 'name' | 'slug'>
  variants: VariantWithInventory[]
  images: ProductImage[]
  attributes: ProductAttribute[]
}

export type ProductListItem = Pick<
  Product,
  'id' | 'name' | 'slug' | 'base_price' | 'sale_price' | 'is_featured' | 'is_best_seller' | 'is_new_arrival' | 'status'
> & {
  primary_image: string | null
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
  product_type: string | null
  tags: string[]
}

// Lightweight shape used by Zustand wishlist/cart stores and ProductCard
export type ProductSummary = {
  id: string
  slug: string
  name: string
  price: number
  oldPrice?: number
  image: string
  images?: string[]
  isNew?: boolean
  discountBadge?: string
}

export type ProductFilters = {
  category?: string
  search?: string
  status?: string
  featured?: boolean
  bestSeller?: boolean
  newArrival?: boolean
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular'
  page?: number
  limit?: number
  // Storefront filter params
  size?: string
  price_min?: number
  price_max?: number
  product_type?: string
  tag?: string
  exclude?: string
}

export type ProductFilterMetadata = {
  sizes: string[]
  product_types: string[]
  tags: string[]
  subcategories: { name: string; slug: string }[]
  parent_category: { name: string; slug: string } | null
  price_min: number
  price_max: number
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
