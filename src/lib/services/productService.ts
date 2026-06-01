import { ProductRepository } from '@/lib/repositories/productRepository'
import type { ProductFilters, PaginatedProducts, ProductListItem, ProductWithVariants } from '@/types/product'

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
}
