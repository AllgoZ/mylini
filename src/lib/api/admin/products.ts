import { apiFetch } from './index'
import type { PaginatedProducts, ProductWithVariants } from '@/types/product'
import type { CreateProductInput, UpdateProductInput, CreateVariantInput, UpdateVariantInput, AddImageInput } from '@/lib/validations/adminProductSchema'

export async function adminListProducts(filters: { search?: string; status?: string; category?: string; page?: number; limit?: number } = {}): Promise<PaginatedProducts> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })
  return apiFetch<PaginatedProducts>(`/api/admin/products?${params}`)
}

export async function adminGetProduct(id: string): Promise<ProductWithVariants> {
  return apiFetch<ProductWithVariants>(`/api/admin/products/${id}`)
}

export async function adminCreateProduct(data: CreateProductInput): Promise<{ id: string; slug: string }> {
  return apiFetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
}

export async function adminUpdateProduct(id: string, data: UpdateProductInput): Promise<void> {
  await apiFetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
}

export async function adminDeleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' })
}

export async function adminAddVariant(productId: string, data: CreateVariantInput): Promise<{ id: string }> {
  return apiFetch(`/api/admin/products/${productId}/variants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
}

export async function adminUpdateVariant(productId: string, variantId: string, data: UpdateVariantInput): Promise<void> {
  await apiFetch(`/api/admin/products/${productId}/variants/${variantId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
}

export async function adminDeleteVariant(productId: string, variantId: string): Promise<void> {
  await apiFetch(`/api/admin/products/${productId}/variants/${variantId}`, { method: 'DELETE' })
}

export async function adminAddImage(productId: string, data: AddImageInput): Promise<void> {
  await apiFetch(`/api/admin/products/${productId}/images`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
}

export async function adminUpdateImage(productId: string, imageId: string, data: { sort_order?: number; is_primary?: boolean; alt_text?: string }): Promise<void> {
  await apiFetch(`/api/admin/products/${productId}/images/${imageId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
}

export async function adminDeleteImage(productId: string, imageId: string): Promise<void> {
  await apiFetch(`/api/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' })
}
