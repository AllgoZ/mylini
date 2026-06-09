import { ProductRepository } from '@/lib/repositories/productRepository'
import { storageProvider } from '@/lib/storage'
import { AppError } from '@/lib/utils/errors'
import type { ProductFilters, ProductFilterMetadata, PaginatedProducts, ProductListItem, ProductWithVariants } from '@/types/product'
import type { Database } from '@/lib/db/generated/database.types'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export const ProductService = {
  async list(filters: ProductFilters): Promise<PaginatedProducts> {
    return ProductRepository.findAll(filters)
  },

  async getFilterMetadata(category?: string): Promise<ProductFilterMetadata> {
    return ProductRepository.getFilterMetadata(category)
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
    const slug = (data.slug as string) ?? ''
    if (await ProductRepository.slugExists(slug)) {
      throw new AppError(
        `The slug "${slug}" is already in use by another product. Change it in the SEO section before saving.`,
        409,
        'SLUG_CONFLICT'
      )
    }
    return ProductRepository.create(data)
  },

  async update(id: string, data: ProductUpdate): Promise<void> {
    return ProductRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    return ProductRepository.softDelete(id)
  },

  async addVariant(productId: string, data: { sku: string; size?: string; color?: string; price_override?: number; is_active?: boolean; initial_stock?: number }): Promise<{ id: string }> {
    return ProductRepository.createVariant({ product_id: productId, ...data })
  },

  async updateVariant(variantId: string, data: { sku?: string; size?: string; color?: string; price_override?: number | null; is_active?: boolean }): Promise<void> {
    return ProductRepository.updateVariant(variantId, data)
  },

  async deleteVariant(variantId: string): Promise<void> {
    return ProductRepository.softDeleteVariant(variantId)
  },

  async addImage(productId: string, data: { public_url: string; alt_text?: string; sort_order?: number; is_primary?: boolean; storage_key?: string; storage_provider?: string; width?: number; height?: number }): Promise<void> {
    return ProductRepository.addImage({
      product_id: productId,
      public_url: data.public_url,
      alt_text: data.alt_text ?? null,
      sort_order: data.sort_order ?? 0,
      is_primary: data.is_primary ?? false,
      storage_key: data.storage_key ?? data.public_url,
      storage_provider: data.storage_provider ?? 'url',
      width: data.width ?? null,
      height: data.height ?? null,
    } as any)
  },

  async removeImage(imageId: string): Promise<void> {
    // Fetch metadata before deleting from DB so we can clean up storage
    const image = await ProductRepository.findImageById(imageId)
    await ProductRepository.removeImage(imageId)
    if (image?.storage_provider === 'cloudinary' && image.storage_key) {
      // Fire-and-forget — don't fail the request if Cloudinary delete fails
      storageProvider.delete(image.storage_key).catch(() => null)
      // Also delete the auto-generated thumbnail (key suffixed with -thumb)
      storageProvider.delete(`${image.storage_key}-thumb`).catch(() => null)
    }
  },

  async updateImage(imageId: string, data: { sort_order?: number; is_primary?: boolean; alt_text?: string }): Promise<void> {
    return ProductRepository.updateImage(imageId, data)
  },

  async replaceAttributes(productId: string, attributes: { key: string; value: string }[]): Promise<void> {
    return ProductRepository.replaceAttributes(productId, attributes)
  },

  async deleteAttribute(attributeId: string): Promise<void> {
    return ProductRepository.deleteAttribute(attributeId)
  },
}
