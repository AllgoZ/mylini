import type { PaginatedProducts, ProductWithVariants } from '@/types/product'
import type { ProductQueryInput } from '@/lib/validations/productSchema'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...options })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Request failed')
  return json.data as T
}

export async function getProducts(filters: Partial<ProductQueryInput> = {}): Promise<PaginatedProducts> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.set(k, String(v))
  })
  return apiFetch<PaginatedProducts>(`/api/products?${params.toString()}`)
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants> {
  return apiFetch<ProductWithVariants>(`/api/products/${encodeURIComponent(slug)}`)
}
