import { ProductRepository } from '@/lib/repositories/productRepository'
import type { ProductFilters, PaginatedProducts, ProductListItem, ProductWithVariants } from '@/types/product'
import type { Database } from '@/lib/db/generated/database.types'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export const ProductService = {
  async list(filters: ProductFilters): Promise<PaginatedProducts> {
    return ProductRepository.findAll(filters)
  },

  async getBySlug(slug: string): Promise<ProductWithVariants> {
    return ProductRepository.findBySlug(slug)
  },

  async search(query: string, limit?: number): Promise<ProductListItem[]> {
    return ProductRepository.search(query, limit)
  },

  async getFeatured(limit?: number): Promise<ProductListItem[]> {
    return ProductRepository.findFeatured(limit)
  },

  async getBestSellers(limit?: number): Promise<ProductListItem[]> {
    return ProductRepository.findBestSellers(limit)
  },

  async getNewArrivals(limit?: number): Promise<ProductListItem[]> {
    return ProductRepository.findNewArrivals(limit)
  },

  // ─── Admin write methods ──────────────────────────────────────────────────────

  async listForAdmin(filters: { search?: string; status?: string; category?: string; page?: number; limit?: number }): Promise<PaginatedProducts> {
    return ProductRepository.findAllForAdmin(filters)
  },

  async getByIdForAdmin(id: string): Promise<ProductWithVariants> {
    return ProductRepository.findByIdForAdmin(id)
  },

  async create(data: ProductInsert): Promise<{ id: string; slug: string }> {
    return ProductRepository.create(data)
  },

  async update(id: string, data: ProductUpdate): Promise<void> {
    return ProductRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    return ProductRepository.softDelete(id)
  },

  async addVariant(productId: string, data: { sku: string; size?: string; color?: string; price_override?: number; is_active?: boolean }): Promise<{ id: string }> {
    return ProductRepository.createVariant({ product_id: productId, ...data })
  },

  async updateVariant(variantId: string, data: { sku?: string; size?: string; color?: string; price_override?: number | null; is_active?: boolean }): Promise<void> {
    return ProductRepository.updateVariant(variantId, data)
  },

  async deleteVariant(variantId: string): Promise<void> {
    return ProductRepository.softDeleteVariant(variantId)
  },

  async addImage(productId: string, data: { public_url: string; alt_text?: string; sort_order?: number; is_primary?: boolean; storage_key?: string; storage_provider?: string }): Promise<void> {
    return ProductRepository.addImage({
      product_id: productId,
      public_url: data.public_url,
      alt_text: data.alt_text ?? null,
      sort_order: data.sort_order ?? 0,
      is_primary: data.is_primary ?? false,
      storage_key: data.storage_key ?? data.public_url,
      storage_provider: data.storage_provider ?? 'url',
    })
  },

  async removeImage(imageId: string): Promise<void> {
    return ProductRepository.removeImage(imageId)
  },

  async updateImage(imageId: string, data: { sort_order?: number; is_primary?: boolean; alt_text?: string }): Promise<void> {
    return ProductRepository.updateImage(imageId, data)
  },
}
