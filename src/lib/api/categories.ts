import type { Category } from '@/types/product'

export type CategoryTree = Category & { children: CategoryTree[] }

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Request failed')
  return json.data as T
}

export async function getCategories(): Promise<CategoryTree[]> {
  return apiFetch<CategoryTree[]>('/api/categories')
}
