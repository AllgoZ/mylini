import type { ProductSummary } from '@/types/product'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Request failed')
  return json.data as T
}

export async function getWishlist(): Promise<ProductSummary[]> {
  return apiFetch<ProductSummary[]>('/api/wishlist')
}

export async function toggleWishlistItem(productId: string): Promise<ProductSummary[]> {
  return apiFetch<ProductSummary[]>('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId }),
  })
}
